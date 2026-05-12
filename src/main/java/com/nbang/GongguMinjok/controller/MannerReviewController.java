package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.MannerReviewRequestDto;
import com.nbang.GongguMinjok.dto.MannerReviewResponseDto;
import com.nbang.GongguMinjok.service.MannerReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MannerReviewController {

    private final MannerReviewService mannerReviewService;

    // POST /api/groupbuys/{groupBuyId}/reviews
    @PostMapping("/groupbuys/{groupBuyId}/reviews")
    public ResponseEntity<MannerReviewResponseDto> submitReview(
            @PathVariable Long groupBuyId,
            @RequestBody MannerReviewRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                mannerReviewService.submitReview(groupBuyId, userDetails.getUsername(), dto));
    }

    // GET /api/groupbuys/{groupBuyId}/reviews/can-review
    @GetMapping("/groupbuys/{groupBuyId}/reviews/can-review")
    public ResponseEntity<Map<String, Boolean>> canReview(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean result = mannerReviewService.canReview(groupBuyId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("canReview", result));
    }

    // GET /api/users/{userId}/reviews
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<List<MannerReviewResponseDto>> getReceivedReviews(
            @PathVariable Long userId) {
        return ResponseEntity.ok(mannerReviewService.getReceivedReviews(userId));
    }
}
