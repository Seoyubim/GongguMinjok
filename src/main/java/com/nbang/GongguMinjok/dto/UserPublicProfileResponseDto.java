package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.User;
import lombok.Getter;

import java.util.List;

@Getter
public class UserPublicProfileResponseDto {

    private final Long userId;
    private final String nickname;
    private final String profileImage;
    private final double mannerScore;
    private final User.MannerGrade mannerGrade;
    private final long monthlyGroupBuyCreateCount;
    private final Integer monthlyGroupBuyCreateLimit;
    private final long participationCount;
    private final long receivedReviewCount;
    private final long receivedReviewWriterCount;
    private final List<ReviewSummaryResponseDto.ItemCountDto> receivedReviewItemCounts;
    private final List<MannerReviewResponseDto> recentReviews;

    public UserPublicProfileResponseDto(
            User user,
            long monthlyGroupBuyCreateCount,
            Integer monthlyGroupBuyCreateLimit,
            long participationCount,
            long receivedReviewCount,
            long receivedReviewWriterCount,
            List<ReviewSummaryResponseDto.ItemCountDto> receivedReviewItemCounts,
            List<MannerReviewResponseDto> recentReviews) {
        this.userId = user.getId();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
        this.mannerScore = user.getMannerScore();
        this.mannerGrade = user.getMannerGrade();
        this.monthlyGroupBuyCreateCount = monthlyGroupBuyCreateCount;
        this.monthlyGroupBuyCreateLimit = monthlyGroupBuyCreateLimit;
        this.participationCount = participationCount;
        this.receivedReviewCount = receivedReviewCount;
        this.receivedReviewWriterCount = receivedReviewWriterCount;
        this.receivedReviewItemCounts = receivedReviewItemCounts;
        this.recentReviews = recentReviews;
    }
}
