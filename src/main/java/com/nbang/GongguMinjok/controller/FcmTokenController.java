package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.FcmTokenRequestDto;
import com.nbang.GongguMinjok.service.FcmTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fcm-token")
@RequiredArgsConstructor
public class FcmTokenController {

    private final FcmTokenService fcmTokenService;

    @PostMapping
    public ResponseEntity<Void> registerToken(
            @RequestBody FcmTokenRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        fcmTokenService.registerToken(
                userDetails.getUsername(), request.getToken(), request.getDeviceType());
        return ResponseEntity.ok().build();
    }
}
