package com.nbang.GongguMinjok.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminRefundDto {
    private Long groupBuyId;
    private String title;
    private String hostNickname;
    private double hostMannerScore;
    private int participantCount;
    private int pickupCompletedCount;
    private int pickupTotalCount;
    private LocalDateTime pickupDeadline;
    private int refundTotal;
    private String refundStatus;
}
