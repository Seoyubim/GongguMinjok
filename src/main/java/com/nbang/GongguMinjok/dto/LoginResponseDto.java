package com.nbang.GongguMinjok.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class LoginResponseDto {

    private String accessToken;
    private Long id;
    private String email;
    private String nickname;
    private String location;
    private boolean premiumActive;
    private LocalDateTime premiumUntil;
    private String role;
}
