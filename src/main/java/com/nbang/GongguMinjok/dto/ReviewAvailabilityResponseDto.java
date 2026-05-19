package com.nbang.GongguMinjok.dto;

public record ReviewAvailabilityResponseDto(
        ReviewAvailabilityStatus status,
        String message
) {
    public static ReviewAvailabilityResponseDto canReview() {
        return new ReviewAvailabilityResponseDto(ReviewAvailabilityStatus.AVAILABLE, "작성 가능");
    }

    public static ReviewAvailabilityResponseDto blocked(ReviewAvailabilityStatus status, String message) {
        return new ReviewAvailabilityResponseDto(status, message);
    }
}
