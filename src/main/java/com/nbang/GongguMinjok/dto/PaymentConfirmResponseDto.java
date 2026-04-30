package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Payment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PaymentConfirmResponseDto {

    private Long paymentId;
    private String orderId;
    private String paymentKey;
    private int amount;
    private String paymentStatus;
    private Long groupBuyId;
    private String groupBuyStatus;
    private boolean paymentConfirmed;
    private LocalDateTime approvedAt;

    public PaymentConfirmResponseDto(Payment payment) {
        GroupBuy groupBuy = payment.getGroupBuy();

        this.paymentId = payment.getId();
        this.orderId = payment.getOrderId();
        this.paymentKey = payment.getPaymentKey();
        this.amount = payment.getAmount();
        this.paymentStatus = payment.getStatus().name();
        this.groupBuyId = groupBuy.getId();
        this.groupBuyStatus = groupBuy.getStatus().name();
        this.paymentConfirmed = payment.getParticipation().isPaymentConfirmed();
        this.approvedAt = payment.getApprovedAt();
    }
}
