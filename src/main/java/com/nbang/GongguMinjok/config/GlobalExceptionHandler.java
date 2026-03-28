package com.nbang.GongguMinjok.config;

import com.nbang.GongguMinjok.dto.ErrorResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // 모든 Controller에서 발생하는 예외를 여기서 한 번에 잡아줘요!
public class GlobalExceptionHandler {

    // IllegalArgumentException 처리: 이 발생하면 이 메서드가 실행돼요.
    // → 중복 이메일, 중복 닉네임, 비밀번호 불일치 등
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDto> handleIllegalArgument(IllegalArgumentException e) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),  // 400
                e.getMessage()
        );
        return ResponseEntity.badRequest().body(error);
    }

    // 그 외 모든 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleException(Exception e) {
        ErrorResponseDto error = new ErrorResponseDto(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),  // 500
                "서버 오류가 발생했어요. 잠시 후 다시 시도해주세요."
        );
        return ResponseEntity.internalServerError().body(error);
    }
}