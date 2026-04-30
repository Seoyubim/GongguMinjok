package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.Payment;
import com.nbang.GongguMinjok.dto.PaymentConfirmRequestDto;
import com.nbang.GongguMinjok.dto.PaymentConfirmResponseDto;
import com.nbang.GongguMinjok.dto.PaymentFailRequestDto;
import com.nbang.GongguMinjok.dto.PaymentReadyResponseDto;
import com.nbang.GongguMinjok.dto.PaymentResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.PaymentRepository;
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
public class PaymentService {

    private static final String TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    private final ParticipationRepository participationRepository;
    private final PaymentRepository paymentRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${toss.payments.secret-key:}")
    private String tossSecretKey;

    @Transactional
    public PaymentReadyResponseDto createPaymentReady(Long groupBuyId, String email) {
        Participation participation = participationRepository
                .findByGroupBuyIdAndParticipantEmail(groupBuyId, email)
                .orElseThrow(() -> new IllegalArgumentException("결제 가능한 참여 내역이 없습니다."));

        GroupBuy groupBuy = participation.getGroupBuy();
        validatePaymentReady(participation, groupBuy);

        Payment payment = paymentRepository
                .findTopByParticipationIdAndStatusOrderByRequestedAtDesc(
                        participation.getId(), Payment.Status.READY)
                .orElseGet(() -> createPayment(participation, groupBuy));

        return new PaymentReadyResponseDto(payment);
    }

    @Transactional(noRollbackFor = IllegalStateException.class)
    public PaymentConfirmResponseDto confirmTossPayment(PaymentConfirmRequestDto dto, String email) {
        Payment payment = paymentRepository.findByOrderId(dto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 결제 요청입니다."));

        validatePaymentConfirm(payment, dto, email);
        LocalDateTime approvedAt = LocalDateTime.now();
        requestTossConfirm(payment, dto);

        payment.setPaymentKey(dto.getPaymentKey());
        payment.setStatus(Payment.Status.APPROVED);
        payment.setApprovedAt(approvedAt);

        Participation participation = payment.getParticipation();
        participation.setPaymentConfirmed(true);
        participation.setPaidAt(approvedAt);

        GroupBuy groupBuy = payment.getGroupBuy();
        if (isAllParticipantsPaid(groupBuy.getId())) {
            groupBuy.setStatus(GroupBuy.Status.PAYMENT_COMPLETED);
            groupBuyRepository.save(groupBuy);
        }

        return new PaymentConfirmResponseDto(payment);
    }

    @Transactional
    public PaymentResponseDto failTossPayment(PaymentFailRequestDto dto, String email) {
        Payment payment = paymentRepository.findByOrderId(dto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 결제 요청입니다."));

        validatePaymentOwner(payment, email);

        if (payment.getStatus() != Payment.Status.READY) {
            throw new IllegalStateException("실패 처리할 수 있는 결제 요청 상태가 아닙니다.");
        }

        payment.setStatus(resolveFailedStatus(dto));
        payment.setFailReason(createFailReason(dto));

        return new PaymentResponseDto(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponseDto getPayment(String orderId, String email) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 결제 요청입니다."));

        validatePaymentOwner(payment, email);

        return new PaymentResponseDto(payment);
    }

    private void validatePaymentReady(Participation participation, GroupBuy groupBuy) {
        if (groupBuy.getStatus() != GroupBuy.Status.CLOSED) {
            throw new IllegalStateException("결제 대기 상태의 공동구매만 결제할 수 있습니다.");
        }

        if (participation.isPaymentConfirmed()) {
            throw new IllegalStateException("이미 결제가 완료된 참여 내역입니다.");
        }

        if (participation.getPaymentAmount() == null || participation.getPaymentAmount() <= 0) {
            throw new IllegalStateException("확정된 결제 금액이 없습니다.");
        }

        if (participation.getPaymentDeadline() == null) {
            throw new IllegalStateException("결제 기한이 설정되지 않았습니다.");
        }

        if (participation.getPaymentDeadline().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("결제 기한이 지났습니다.");
        }
    }

    private Payment createPayment(Participation participation, GroupBuy groupBuy) {
        Payment payment = new Payment();
        payment.setGroupBuy(groupBuy);
        payment.setParticipation(participation);
        payment.setPayer(participation.getParticipant());
        payment.setOrderId(generateOrderId(groupBuy.getId(), participation.getId()));
        payment.setOrderName(groupBuy.getTitle());
        payment.setAmount(participation.getPaymentAmount());
        payment.setStatus(Payment.Status.READY);
        return paymentRepository.save(payment);
    }

    private void validatePaymentConfirm(Payment payment, PaymentConfirmRequestDto dto, String email) {
        if (tossSecretKey == null || tossSecretKey.isBlank()) {
            throw new IllegalStateException("토스페이먼츠 secret key가 설정되지 않았습니다.");
        }

        if (dto.getPaymentKey() == null || dto.getPaymentKey().isBlank()) {
            throw new IllegalArgumentException("paymentKey가 필요합니다.");
        }

        validatePaymentOwner(payment, email);

        if (payment.getStatus() != Payment.Status.READY) {
            throw new IllegalStateException("승인 가능한 결제 요청 상태가 아닙니다.");
        }

        if (payment.getAmount() != dto.getAmount()) {
            throw new IllegalStateException("결제 금액이 확정 금액과 일치하지 않습니다.");
        }

        Participation participation = payment.getParticipation();
        GroupBuy groupBuy = payment.getGroupBuy();

        if (groupBuy.getStatus() != GroupBuy.Status.CLOSED) {
            throw new IllegalStateException("결제 대기 상태의 공동구매만 승인할 수 있습니다.");
        }

        if (participation.isPaymentConfirmed()) {
            throw new IllegalStateException("이미 결제가 완료된 참여 내역입니다.");
        }

        if (participation.getPaymentDeadline() == null
                || participation.getPaymentDeadline().isBefore(LocalDateTime.now())) {
            payment.setStatus(Payment.Status.EXPIRED);
            payment.setFailReason("Payment deadline expired.");
            throw new IllegalStateException("결제 기한이 지났습니다.");
        }
    }

    private void requestTossConfirm(Payment payment, PaymentConfirmRequestDto dto) {
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
            payment.setStatus(Payment.Status.FAILED);
            payment.setFailReason(e.getResponseBodyAsString());
            throw new IllegalStateException("토스페이먼츠 결제 승인에 실패했습니다.");
        }
    }

    private void validatePaymentOwner(Payment payment, String email) {
        if (!payment.getPayer().getEmail().equals(email)) {
            throw new IllegalStateException("본인의 결제 요청만 처리할 수 있습니다.");
        }
    }

    private Payment.Status resolveFailedStatus(PaymentFailRequestDto dto) {
        String code = dto.getCode();
        if (code != null && code.toUpperCase().contains("CANCEL")) {
            return Payment.Status.CANCELED;
        }
        return Payment.Status.FAILED;
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

    private boolean isAllParticipantsPaid(Long groupBuyId) {
        return participationRepository.findByGroupBuyId(groupBuyId)
                .stream()
                .allMatch(Participation::isPaymentConfirmed);
    }

    private String generateOrderId(Long groupBuyId, Long participationId) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        return "GB-" + groupBuyId + "-P-" + participationId + "-" + suffix;
    }
}
