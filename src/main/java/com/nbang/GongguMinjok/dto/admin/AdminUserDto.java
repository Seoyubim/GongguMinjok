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
public class AdminUserDto {
    private Long id;
    private String nickname;
    private String email;
    private double mannerScore;
    private String mannerGrade;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime premiumUntil;
    private boolean isPremium;
}
