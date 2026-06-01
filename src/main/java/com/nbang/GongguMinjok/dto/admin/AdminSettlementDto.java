package com.nbang.GongguMinjok.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminSettlementDto {
    private Long groupBuyId;
    private String title;
    private String hostNickname;
    private int participantCount;
    private int totalAmount;
    private int pickupCompletedCount;
    private int pickupTotalCount;
    private String status;
}
