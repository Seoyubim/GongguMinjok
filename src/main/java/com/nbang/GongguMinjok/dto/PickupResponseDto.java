package com.nbang.GongguMinjok.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PickupResponseDto {

    private final Long participationId;
    private final LocalDateTime pickupCompletedAt;
    private final boolean allPickupCompleted;
    private final String groupBuyStatus;

    public PickupResponseDto(Long participationId, LocalDateTime pickupCompletedAt,
                             boolean allPickupCompleted, String groupBuyStatus) {
        this.participationId = participationId;
        this.pickupCompletedAt = pickupCompletedAt;
        this.allPickupCompleted = allPickupCompleted;
        this.groupBuyStatus = groupBuyStatus;
    }
}
