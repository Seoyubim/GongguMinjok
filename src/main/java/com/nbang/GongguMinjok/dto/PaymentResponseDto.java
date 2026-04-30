package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Payment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PaymentResponseDto {

    private Long paymentId;
    private String orderId;
    private String orderName;
    private String paymentKey;
    private int amount;
    private String status;
    private String failReason;
    private Long groupBuyId;
    private Long participationId;
    private Long payerId;
    private LocalDateTime requestedAt;
    private LocalDateTime approvedAt;

    public PaymentResponseDto(Payment payment) {
        this.paymentId = payment.getId();
        this.orderId = payment.getOrderId();
        this.orderName = payment.getOrderName();
        this.paymentKey = payment.getPaymentKey();
        this.amount = payment.getAmount();
        this.status = payment.getStatus().name();
        this.failReason = payment.getFailReason();
        this.groupBuyId = payment.getGroupBuy().getId();
        this.participationId = payment.getParticipation().getId();
        this.payerId = payment.getPayer().getId();
        this.requestedAt = payment.getRequestedAt();
        this.approvedAt = payment.getApprovedAt();
    }
}
