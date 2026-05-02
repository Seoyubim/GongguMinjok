package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.MannerReview;
import com.nbang.GongguMinjok.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class MannerReviewResponseDto {

    private final Long reviewId;
    private final Long groupBuyId;
    private final Long reviewerId;
    private final String reviewerNickname;
    private final Long revieweeId;
    private final String revieweeNickname;
    private final MannerReview.ReviewerRole reviewerRole;
    private final MannerReview.Rating rating;
    private final List<String> checkedItems;
    private final double scoreDelta;
    private final double revieweeMannerScore;
    private final User.MannerGrade revieweeMannerGrade;
    private final LocalDateTime createdAt;

    public MannerReviewResponseDto(MannerReview review) {
        this.reviewId = review.getId();
        this.groupBuyId = review.getGroupBuy().getId();
        this.reviewerId = review.getReviewer().getId();
        this.reviewerNickname = review.getReviewer().getNickname();
        this.revieweeId = review.getReviewee().getId();
        this.revieweeNickname = review.getReviewee().getNickname();
        this.reviewerRole = review.getReviewerRole();
        this.rating = review.getRating();
        this.checkedItems = review.getCheckedItems();
        this.scoreDelta = review.getScoreDelta();
        this.revieweeMannerScore = review.getReviewee().getMannerScore();
        this.revieweeMannerGrade = review.getReviewee().getMannerGrade();
        this.createdAt = review.getCreatedAt();
    }
}
