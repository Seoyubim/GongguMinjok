package com.nbang.GongguMinjok.dto;

import lombok.Getter;

@Getter
public class ReviewAvailabilityResponseDto {

    private final ReviewAvailabilityStatus status;
    private final String message;

    private ReviewAvailabilityResponseDto(
            ReviewAvailabilityStatus status,
            String message) {
        this.status = status;
        this.message = message;
    }

    public static ReviewAvailabilityResponseDto available() {
        return new ReviewAvailabilityResponseDto(ReviewAvailabilityStatus.AVAILABLE, "작성 가능");
    }

    public static ReviewAvailabilityResponseDto unavailable(
            ReviewAvailabilityStatus status,
            String message) {
        return new ReviewAvailabilityResponseDto(status, message);
    }
}
