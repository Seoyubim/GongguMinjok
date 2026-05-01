package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.PremiumPayment;
import lombok.Getter;

@Getter
public class PremiumPaymentReadyResponseDto {

    private Long paymentId;
    private String orderId;
    private String orderName;
    private int amount;
    private String customerEmail;
    private String customerName;
    private String status;

    public PremiumPaymentReadyResponseDto(PremiumPayment payment) {
        this.paymentId = payment.getId();
        this.orderId = payment.getOrderId();
        this.orderName = payment.getOrderName();
        this.amount = payment.getAmount();
        this.customerEmail = payment.getUser().getEmail();
        this.customerName = payment.getUser().getNickname();
        this.status = payment.getStatus().name();
    }
}
