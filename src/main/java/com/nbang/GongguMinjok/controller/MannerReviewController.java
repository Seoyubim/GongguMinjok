package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.MannerReviewRequestDto;
import com.nbang.GongguMinjok.dto.MannerReviewResponseDto;
import com.nbang.GongguMinjok.dto.ParticipantReviewStatusDto;
import com.nbang.GongguMinjok.dto.ReviewAvailabilityResponseDto;
import com.nbang.GongguMinjok.dto.ReviewSummaryResponseDto;
import com.nbang.GongguMinjok.service.MannerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MannerReviewController {

    private final MannerReviewService mannerReviewService;

    // POST /api/groupbuys/{groupBuyId}/reviews/participant  (참여자 → 호스트)
    @PostMapping("/groupbuys/{groupBuyId}/reviews/participant")
    public ResponseEntity<MannerReviewResponseDto> submitParticipantReview(
            @PathVariable Long groupBuyId,
            @RequestBody MannerReviewRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                mannerReviewService.submitParticipantReview(groupBuyId, userDetails.getUsername(), dto));
    }

    // POST /api/groupbuys/{groupBuyId}/reviews/host  (호스트 → 참여자, 참여자별 개별 작성)
    @PostMapping("/groupbuys/{groupBuyId}/reviews/host")
    public ResponseEntity<MannerReviewResponseDto> submitHostReview(
            @PathVariable Long groupBuyId,
            @RequestBody MannerReviewRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                mannerReviewService.submitHostReview(groupBuyId, userDetails.getUsername(), dto));
    }

    // GET /api/groupbuys/{groupBuyId}/reviews/host/status  (호스트 전용: 참여자별 후기 작성 상태)
    @GetMapping("/groupbuys/{groupBuyId}/reviews/host/status")
    public ResponseEntity<List<ParticipantReviewStatusDto>> getParticipantReviewStatuses(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                mannerReviewService.getParticipantReviewStatuses(groupBuyId, userDetails.getUsername()));
    }

    // GET /api/groupbuys/{groupBuyId}/reviews/can-review
    @GetMapping("/groupbuys/{groupBuyId}/reviews/can-review")
    public ResponseEntity<ReviewAvailabilityResponseDto> canReview(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mannerReviewService.canReview(groupBuyId, userDetails.getUsername()));
    }

    // GET /api/users/{userId}/reviews
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<List<MannerReviewResponseDto>> getReceivedReviews(
            @PathVariable Long userId) {
        return ResponseEntity.ok(mannerReviewService.getReceivedReviews(userId));
    }

    // GET /api/users/{userId}/reviews/summary
    @GetMapping("/users/{userId}/reviews/summary")
    public ResponseEntity<ReviewSummaryResponseDto> getReceivedReviewSummary(
            @PathVariable Long userId) {
        return ResponseEntity.ok(mannerReviewService.getReceivedReviewSummary(userId));
    }

    // GET /api/users/me/reviews/sent
    @GetMapping("/users/me/reviews/sent")
    public ResponseEntity<List<MannerReviewResponseDto>> getMySentReviews(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mannerReviewService.getSentReviews(userDetails.getUsername()));
    }
}
