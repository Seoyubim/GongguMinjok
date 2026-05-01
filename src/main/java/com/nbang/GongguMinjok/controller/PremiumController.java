package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.PaymentConfirmRequestDto;
import com.nbang.GongguMinjok.dto.PaymentFailRequestDto;
import com.nbang.GongguMinjok.dto.PremiumPaymentReadyResponseDto;
import com.nbang.GongguMinjok.dto.PremiumPaymentResponseDto;
import com.nbang.GongguMinjok.service.PremiumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/premium")
@RequiredArgsConstructor
public class PremiumController {

    private final PremiumService premiumService;

    @PostMapping("/payments/ready")
    public ResponseEntity<PremiumPaymentReadyResponseDto> createPremiumPaymentReady(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                premiumService.createPremiumPaymentReady(userDetails.getUsername()));
    }

    @PostMapping("/payments/toss/confirm")
    public ResponseEntity<PremiumPaymentResponseDto> confirmPremiumPayment(
            @RequestBody PaymentConfirmRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                premiumService.confirmPremiumPayment(dto, userDetails.getUsername()));
    }

    @PostMapping("/payments/toss/fail")
    public ResponseEntity<PremiumPaymentResponseDto> failPremiumPayment(
            @RequestBody PaymentFailRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                premiumService.failPremiumPayment(dto, userDetails.getUsername()));
    }
}
