package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.PasswordChangeRequestDto;
import com.nbang.GongguMinjok.dto.UserPublicProfileResponseDto;
import com.nbang.GongguMinjok.dto.UserProfileUpdateRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getMyProfile(userDetails.getUsername()));
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserPublicProfileResponseDto> getPublicProfile(
            @PathVariable Long userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDto> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserProfileUpdateRequestDto dto) {
        return ResponseEntity.ok(userService.updateMyProfile(userDetails.getUsername(), dto));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PasswordChangeRequestDto dto) {
        userService.changeMyPassword(userDetails.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }
}
