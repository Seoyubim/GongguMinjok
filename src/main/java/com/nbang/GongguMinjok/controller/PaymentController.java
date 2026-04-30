package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.PaymentConfirmRequestDto;
import com.nbang.GongguMinjok.dto.PaymentConfirmResponseDto;
import com.nbang.GongguMinjok.dto.PaymentFailRequestDto;
import com.nbang.GongguMinjok.dto.PaymentReadyResponseDto;
import com.nbang.GongguMinjok.dto.PaymentResponseDto;
import com.nbang.GongguMinjok.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
}
