package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.PremiumPayment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PremiumPaymentResponseDto {

    private Long paymentId;
    private String orderId;
    private String paymentKey;
    private int amount;
    private String status;
    private String failReason;
    private boolean premiumActive;
    private LocalDateTime premiumUntil;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;

    public PremiumPaymentResponseDto(PremiumPayment payment) {
        this.paymentId = payment.getId();
        this.orderId = payment.getOrderId();
        this.paymentKey = payment.getPaymentKey();
        this.amount = payment.getAmount();
        this.status = payment.getStatus().name();
        this.failReason = payment.getFailReason();
        this.premiumActive = payment.getUser().isPremiumActive();
        this.premiumUntil = payment.getUser().getPremiumUntil();
        this.requestedAt = payment.getRequestedAt();
        this.approvedAt = payment.getApprovedAt();
    }
}
