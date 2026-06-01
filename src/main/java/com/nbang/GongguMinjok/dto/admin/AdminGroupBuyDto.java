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
public class AdminGroupBuyDto {
    private Long id;
    private String title;
    private String hostNickname;
    private int currentCount;
    private int maxCount;
    private LocalDateTime deadline;
    private String status;
}
