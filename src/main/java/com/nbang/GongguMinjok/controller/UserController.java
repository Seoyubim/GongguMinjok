package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.UserRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.service.EmailService;
import com.nbang.GongguMinjok.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EmailService emailService;

    // 이메일 인증코드 발송
    // POST /api/auth/email/send
    @PostMapping("/email/send")
    public ResponseEntity<String> sendVerificationCode(@RequestBody Map<String, String> body) {
        emailService.sendVerificationCode(body.get("email"));
        return ResponseEntity.ok("인증코드를 발송했어요!");
    }

    // 이메일 인증코드 확인
    // POST /api/auth/email/verify
    @PostMapping("/email/verify")
    public ResponseEntity<String> verifyCode(@RequestBody Map<String, String> body) {
        emailService.verifyCode(body.get("email"), body.get("code"));
        return ResponseEntity.ok("이메일 인증 완료!");
    }

    // 회원가입
    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@RequestBody UserRequestDto dto) {
        UserResponseDto response = userService.register(dto);
        return ResponseEntity.ok(response);
    }
}