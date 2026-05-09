package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Settlement;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SettlementResponseDto {

    private final Long settlementId;
    private final Long groupBuyId;
    private final int totalAmount;
    private final Settlement.Status status;
    private final LocalDateTime settledAt;
    private final LocalDateTime createdAt;

    public SettlementResponseDto(Settlement settlement) {
        this.settlementId = settlement.getId();
        this.groupBuyId = settlement.getGroupBuy().getId();
        this.totalAmount = settlement.getTotalAmount();
        this.status = settlement.getStatus();
        this.settledAt = settlement.getSettledAt();
        this.createdAt = settlement.getCreatedAt();
    }
}
