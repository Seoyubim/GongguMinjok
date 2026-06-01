package com.nbang.GongguMinjok.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsDto {
    private long pendingSettlementCount;
    private long activeGroupBuyCount;
    private long blockedUserCount;
    private long todaySignupCount;
}
