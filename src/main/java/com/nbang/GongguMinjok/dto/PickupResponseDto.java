package com.nbang.GongguMinjok.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PickupResponseDto {

    private final Long participationId;
    private final LocalDateTime pickupCompletedAt;
    private final boolean allPickupCompleted;
    private final SettlementResponseDto settlement;

    public PickupResponseDto(Long participationId, LocalDateTime pickupCompletedAt,
                             boolean allPickupCompleted, SettlementResponseDto settlement) {
        this.participationId = participationId;
        this.pickupCompletedAt = pickupCompletedAt;
        this.allPickupCompleted = allPickupCompleted;
        this.settlement = settlement;
    }
}
