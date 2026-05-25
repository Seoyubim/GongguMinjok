package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.service.FcmService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test/fcm")
@RequiredArgsConstructor
public class FcmTestController {

    private final FcmService fcmService;

    @PostMapping
    public ResponseEntity<String> sendFcm(@RequestBody Map<String, String> body) {
        fcmService.sendMessage(
                body.get("token"),
                body.get("title"),
                body.get("body")
        );
        return ResponseEntity.ok("FCM 알림 전송 완료");
    }
}
