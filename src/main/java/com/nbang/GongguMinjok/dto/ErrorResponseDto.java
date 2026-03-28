package com.nbang.GongguMinjok.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ErrorResponseDto {

    private int status;        // HTTP 상태코드 (400, 404, 500 등)
    private String message;    // 에러 메시지
    private LocalDateTime timestamp;  // 에러 발생 시간

    public ErrorResponseDto(int status, String message) {
        this.status = status;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
}