package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Payment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PaymentReadyResponseDto {

    private Long paymentId;
    private String orderId;
    private String orderName;
    private int amount;
    private String customerEmail;
    private String customerName;
    private String status;
    private LocalDateTime paymentDeadline;

    public PaymentReadyResponseDto(Payment payment) {
        this.paymentId = payment.getId();
        this.orderId = payment.getOrderId();
        this.orderName = payment.getOrderName();
        this.amount = payment.getAmount();
        this.customerEmail = payment.getPayer().getEmail();
        this.customerName = payment.getPayer().getNickname();
        this.status = payment.getStatus().name();
        this.paymentDeadline = payment.getParticipation().getPaymentDeadline();
    }
}
