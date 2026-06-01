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
public class AdminGroupBuyDetailDto {
    private Long id;
    private String title;
    private String hostNickname;
    private int currentCount;
    private int maxCount;
    private LocalDateTime deadline;
    private String status;
    private String description;
    private String category;
    private List<ParticipantInfo> participants;
    private List<HistoryEntry> history;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ParticipantInfo {
        private String nickname;
        private LocalDateTime joinDate;
        private String statusLabel;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HistoryEntry {
        private String action;
        private LocalDateTime date;
    }
}
