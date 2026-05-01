package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.PremiumPayment;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.PaymentConfirmRequestDto;
import com.nbang.GongguMinjok.dto.PaymentFailRequestDto;
import com.nbang.GongguMinjok.dto.PremiumPaymentReadyResponseDto;
import com.nbang.GongguMinjok.dto.PremiumPaymentResponseDto;
import com.nbang.GongguMinjok.repository.PremiumPaymentRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PremiumService {

    private static final int PREMIUM_PRICE = 4900;
    private static final String PREMIUM_ORDER_NAME = "공구민족 프리미엄 1개월";
    private static final String TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    private final UserRepository userRepository;
    private final PremiumPaymentRepository premiumPaymentRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${toss.payments.secret-key:}")
    private String tossSecretKey;

    @Transactional
    public PremiumPaymentReadyResponseDto createPremiumPaymentReady(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        PremiumPayment payment = premiumPaymentRepository
                .findTopByUserIdAndStatusOrderByRequestedAtDesc(user.getId(), PremiumPayment.Status.READY)
                .orElseGet(() -> createPremiumPayment(user));

        return new PremiumPaymentReadyResponseDto(payment);
    }

    @Transactional(noRollbackFor = IllegalStateException.class)
    public PremiumPaymentResponseDto confirmPremiumPayment(PaymentConfirmRequestDto dto, String email) {
        PremiumPayment payment = premiumPaymentRepository.findByOrderId(dto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프리미엄 결제 요청입니다."));

        validatePremiumPaymentConfirm(payment, dto, email);
        LocalDateTime approvedAt = LocalDateTime.now();
        requestTossConfirm(payment, dto);

        User user = payment.getUser();
        LocalDateTime baseTime = user.isPremiumActive() ? user.getPremiumUntil() : approvedAt;

        payment.setPaymentKey(dto.getPaymentKey());
        payment.setStatus(PremiumPayment.Status.APPROVED);
        payment.setApprovedAt(approvedAt);
        user.setPremiumUntil(baseTime.plusMonths(1));

        return new PremiumPaymentResponseDto(payment);
    }

    @Transactional
    public PremiumPaymentResponseDto failPremiumPayment(PaymentFailRequestDto dto, String email) {
        PremiumPayment payment = premiumPaymentRepository.findByOrderId(dto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프리미엄 결제 요청입니다."));

        validatePremiumPaymentOwner(payment, email);

        if (payment.getStatus() != PremiumPayment.Status.READY) {
            throw new IllegalStateException("실패 처리할 수 있는 프리미엄 결제 요청 상태가 아닙니다.");
        }

        payment.setStatus(resolveFailedStatus(dto));
        payment.setFailReason(createFailReason(dto));

        return new PremiumPaymentResponseDto(payment);
    }

    private PremiumPayment createPremiumPayment(User user) {
        PremiumPayment payment = new PremiumPayment();
        payment.setUser(user);
        payment.setOrderId(generateOrderId(user.getId()));
        payment.setOrderName(PREMIUM_ORDER_NAME);
        payment.setAmount(PREMIUM_PRICE);
        payment.setStatus(PremiumPayment.Status.READY);
        return premiumPaymentRepository.save(payment);
    }

    private void validatePremiumPaymentConfirm(PremiumPayment payment, PaymentConfirmRequestDto dto, String email) {
        if (tossSecretKey == null || tossSecretKey.isBlank()) {
            throw new IllegalStateException("토스페이먼츠 secret key가 설정되지 않았습니다.");
        }

        if (dto.getPaymentKey() == null || dto.getPaymentKey().isBlank()) {
            throw new IllegalArgumentException("paymentKey가 필요합니다.");
        }

        validatePremiumPaymentOwner(payment, email);

        if (payment.getStatus() != PremiumPayment.Status.READY) {
            throw new IllegalStateException("승인 가능한 프리미엄 결제 요청 상태가 아닙니다.");
        }

        if (payment.getAmount() != dto.getAmount()) {
            throw new IllegalStateException("프리미엄 결제 금액이 일치하지 않습니다.");
        }
    }

    private void requestTossConfirm(PremiumPayment payment, PaymentConfirmRequestDto dto) {
        try {
            restClient.post()
                    .uri(TOSS_CONFIRM_URL)
                    .header(HttpHeaders.AUTHORIZATION, createTossAuthorizationHeader())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "paymentKey", dto.getPaymentKey(),
                            "orderId", dto.getOrderId(),
                            "amount", dto.getAmount()
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            payment.setStatus(PremiumPayment.Status.FAILED);
            payment.setFailReason(e.getResponseBodyAsString());
            throw new IllegalStateException("토스페이먼츠 프리미엄 결제 승인에 실패했습니다.");
        }
    }

    private void validatePremiumPaymentOwner(PremiumPayment payment, String email) {
        if (!payment.getUser().getEmail().equals(email)) {
            throw new IllegalStateException("본인의 프리미엄 결제 요청만 처리할 수 있습니다.");
        }
    }

    private PremiumPayment.Status resolveFailedStatus(PaymentFailRequestDto dto) {
        String code = dto.getCode();
        if (code != null && code.toUpperCase().contains("CANCEL")) {
            return PremiumPayment.Status.CANCELED;
        }
        return PremiumPayment.Status.FAILED;
    }

    private String createFailReason(PaymentFailRequestDto dto) {
        String code = dto.getCode() == null ? "UNKNOWN" : dto.getCode();
        String message = dto.getMessage() == null ? "" : dto.getMessage();
        return code + ": " + message;
    }

    private String createTossAuthorizationHeader() {
        String credential = tossSecretKey + ":";
        String encoded = Base64.getEncoder()
                .encodeToString(credential.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }

    private String generateOrderId(Long userId) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        return "PREMIUM-U-" + userId + "-" + suffix;
    }
}
