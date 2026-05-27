package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.PaymentConfirmRequestDto;
import com.nbang.GongguMinjok.dto.PaymentConfirmResponseDto;
import com.nbang.GongguMinjok.dto.PaymentFailRequestDto;
import com.nbang.GongguMinjok.dto.PaymentReadyResponseDto;
import com.nbang.GongguMinjok.dto.PaymentResponseDto;
import com.nbang.GongguMinjok.dto.TossWebhookRequestDto;
import com.nbang.GongguMinjok.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/groupbuys/{groupBuyId}/payments/ready")
    public ResponseEntity<PaymentReadyResponseDto> createPaymentReady(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                paymentService.createPaymentReady(groupBuyId, userDetails.getUsername()));
    }

    @PostMapping("/payments/toss/confirm")
    public ResponseEntity<PaymentConfirmResponseDto> confirmTossPayment(
            @RequestBody PaymentConfirmRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                paymentService.confirmTossPayment(dto, userDetails.getUsername()));
    }

    @PostMapping("/payments/toss/fail")
    public ResponseEntity<PaymentResponseDto> failTossPayment(
            @RequestBody PaymentFailRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                paymentService.failTossPayment(dto, userDetails.getUsername()));
    }

    @GetMapping("/payments/{orderId}")
    public ResponseEntity<PaymentResponseDto> getPayment(
            @PathVariable String orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                paymentService.getPayment(orderId, userDetails.getUsername()));
    }

    // POST /api/payments/toss/webhook
    // 토스페이먼츠 → 우리 서버로 결제 상태 변경 이벤트 수신
    @PostMapping("/payments/toss/webhook")
    public ResponseEntity<Void> tossWebhook(
            @RequestHeader("Authorization") String authorization,
            @RequestBody TossWebhookRequestDto dto) {
        paymentService.handleTossWebhook(authorization, dto);
        return ResponseEntity.ok().build();
    }
}
