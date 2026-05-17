package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.MannerReview;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.MannerReviewRequestDto;
import com.nbang.GongguMinjok.dto.MannerReviewResponseDto;
import com.nbang.GongguMinjok.dto.ReviewAvailabilityResponseDto;
import com.nbang.GongguMinjok.dto.ReviewAvailabilityStatus;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.MannerReviewRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MannerReviewService {

    private static final int REVIEW_WINDOW_DAYS = 7;

    private final MannerReviewRepository mannerReviewRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;
    private final ParticipationRepository participationRepository;

    @Transactional
    public MannerReviewResponseDto submitReview(Long groupBuyId, String reviewerEmail, MannerReviewRequestDto dto) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        validateGroupBuyCompleted(groupBuy);
        validateReviewWindow(groupBuy);
        validateNoDuplicateReview(groupBuyId, reviewer.getId());

        User reviewee = userRepository.findById(dto.getRevieweeId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 피평가자입니다."));

        if (reviewer.getId().equals(reviewee.getId())) {
            throw new IllegalArgumentException("자신을 평가할 수 없습니다.");
        }

        boolean reviewerIsHost = groupBuy.getHost().getId().equals(reviewer.getId());
        boolean revieweeIsHost = groupBuy.getHost().getId().equals(reviewee.getId());

        MannerReview.ReviewerRole role = validateParticipantsAndGetRole(
                groupBuyId, reviewer, reviewee, reviewerIsHost, revieweeIsHost);

        double delta = calculateDelta(dto.getRating(), dto.getCheckedItems().size());

        MannerReview review = new MannerReview();
        review.setGroupBuy(groupBuy);
        review.setReviewer(reviewer);
        review.setReviewee(reviewee);
        review.setReviewerRole(role);
        review.setRating(dto.getRating());
        review.setCheckedItems(dto.getCheckedItems());
        review.setScoreDelta(delta);
        mannerReviewRepository.save(review);

        reviewee.updateMannerScore(delta);
        userRepository.save(reviewee);

        return new MannerReviewResponseDto(review);
    }

    @Transactional(readOnly = true)
    public List<MannerReviewResponseDto> getReceivedReviews(Long userId) {
        return mannerReviewRepository.findByRevieweeId(userId).stream()
                .map(MannerReviewResponseDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewAvailabilityResponseDto canReview(Long groupBuyId, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        boolean isHost = groupBuy.getHost().getId().equals(reviewer.getId());
        boolean isParticipant = participationRepository.existsByGroupBuyIdAndParticipantId(
                groupBuyId, reviewer.getId());

        if (!isHost && !isParticipant) {
            throw new AccessDeniedException("해당 공동구매의 참여자만 후기를 작성할 수 있습니다.");
        }

        if (mannerReviewRepository.existsByGroupBuyIdAndReviewerId(groupBuyId, reviewer.getId())) {
            return ReviewAvailabilityResponseDto.unavailable(
                    ReviewAvailabilityStatus.ALREADY_REVIEWED,
                    "작성 완료");
        }

        if (groupBuy.getStatus() != GroupBuy.Status.COMPLETED || groupBuy.getCompletedAt() == null) {
            return ReviewAvailabilityResponseDto.unavailable(
                    ReviewAvailabilityStatus.NOT_COMPLETED,
                    "공동구매 미완료");
        }

        if (groupBuy.getCompletedAt().plusDays(REVIEW_WINDOW_DAYS).isBefore(LocalDateTime.now())) {
            return ReviewAvailabilityResponseDto.unavailable(
                    ReviewAvailabilityStatus.EXPIRED,
                    "기한 만료");
        }

        return ReviewAvailabilityResponseDto.available();
    }

    private void validateGroupBuyCompleted(GroupBuy groupBuy) {
        if (groupBuy.getStatus() != GroupBuy.Status.COMPLETED) {
            throw new IllegalStateException("완료된 공동구매만 평가할 수 있습니다.");
        }
    }

    private void validateReviewWindow(GroupBuy groupBuy) {
        if (groupBuy.getCompletedAt() == null ||
                groupBuy.getCompletedAt().plusDays(REVIEW_WINDOW_DAYS).isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("평가 기한(" + REVIEW_WINDOW_DAYS + "일)이 지났습니다.");
        }
    }

    private void validateNoDuplicateReview(Long groupBuyId, Long reviewerId) {
        if (mannerReviewRepository.existsByGroupBuyIdAndReviewerId(groupBuyId, reviewerId)) {
            throw new IllegalStateException("이미 평가를 제출했습니다.");
        }
    }

    private MannerReview.ReviewerRole validateParticipantsAndGetRole(
            Long groupBuyId, User reviewer, User reviewee,
            boolean reviewerIsHost, boolean revieweeIsHost) {

        if (reviewerIsHost) {
            // 호스트(판매자) → 구매자 평가
            if (revieweeIsHost) {
                throw new IllegalArgumentException("호스트는 다른 참여자를 평가해야 합니다.");
            }
            if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, reviewee.getId())) {
                throw new IllegalArgumentException("해당 공동구매의 참여자가 아닙니다.");
            }
            return MannerReview.ReviewerRole.SELLER;
        } else {
            // 구매자 → 호스트(판매자) 평가
            if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, reviewer.getId())) {
                throw new IllegalArgumentException("해당 공동구매에 참여하지 않았습니다.");
            }
            if (!revieweeIsHost) {
                throw new IllegalArgumentException("구매자는 호스트만 평가할 수 있습니다.");
            }
            return MannerReview.ReviewerRole.BUYER;
        }
    }

    private double calculateDelta(MannerReview.Rating rating, int itemCount) {
        return switch (rating) {
            case BAD   -> itemCount * (-0.1);
            case GOOD  -> itemCount * 0.1;
            case GREAT -> itemCount * 0.2;
        };
    }
}
