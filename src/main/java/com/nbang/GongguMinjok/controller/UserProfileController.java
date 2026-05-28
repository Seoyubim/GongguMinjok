package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.BankAccountRequestDto;
import com.nbang.GongguMinjok.dto.PasswordChangeRequestDto;
import com.nbang.GongguMinjok.dto.ProfileImageUploadResponseDto;
import com.nbang.GongguMinjok.dto.UserPublicProfileResponseDto;
import com.nbang.GongguMinjok.dto.UserProfileUpdateRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.service.S3ImageService;
import com.nbang.GongguMinjok.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;
    private final S3ImageService s3ImageService;

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

    @PostMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileImageUploadResponseDto> uploadMyProfileImage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("image") MultipartFile image) {
        UserResponseDto profile = userService.getMyProfile(userDetails.getUsername());
        String imageUrl = s3ImageService.uploadProfileImage(profile.getId(), image);
        return ResponseEntity.ok(new ProfileImageUploadResponseDto(imageUrl));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PasswordChangeRequestDto dto) {
        userService.changeMyPassword(userDetails.getUsername(), dto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/account")
    public ResponseEntity<UserResponseDto> updateBankAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody BankAccountRequestDto dto) {
        return ResponseEntity.ok(userService.updateBankAccount(userDetails.getUsername(), dto));
    }

    @DeleteMapping("/me/withdraw")
    public ResponseEntity<Void> withdrawMyAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.withdrawUser(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
