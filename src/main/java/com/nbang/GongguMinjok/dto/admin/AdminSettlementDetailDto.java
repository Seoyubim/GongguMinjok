package com.nbang.GongguMinjok.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminSettlementDetailDto {
    private Long groupBuyId;
    private String title;
    private String hostNickname;
    private int participantCount;
    private int totalAmount;
    private int pickupCompletedCount;
    private int pickupTotalCount;
    private String status;
    private List<SettlementParticipantInfo> participants;
    private LocalDateTime deadline;
    private String pickupLocation;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SettlementParticipantInfo {
        private String nickname;
        private int amount;
        private boolean pickupCompleted;
    }
}
