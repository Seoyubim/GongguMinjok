package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TossWebhookRequestDto {

    private String eventType;
    private String createdAt;
    private Data data;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Data {
        private String paymentKey;
        private String orderId;
        private String status;
    }
}
