package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.MannerReview;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.MannerReviewRequestDto;
import com.nbang.GongguMinjok.dto.MannerReviewResponseDto;
import com.nbang.GongguMinjok.dto.ParticipantReviewStatusDto;
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

    // 참여자 → 호스트 후기 제출
    @Transactional
    public MannerReviewResponseDto submitParticipantReview(Long groupBuyId, String reviewerEmail, MannerReviewRequestDto dto) {
        User reviewer = findUserByEmail(reviewerEmail);
        GroupBuy groupBuy = findGroupBuy(groupBuyId);

        validateGroupBuyCompleted(groupBuy);
        validateReviewWindow(groupBuy);

        if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, reviewer.getId())) {
            throw new AccessDeniedException("해당 공동구매의 참여자만 후기를 작성할 수 있습니다.");
        }
        if (groupBuy.getHost().getId().equals(reviewer.getId())) {
            throw new IllegalArgumentException("호스트는 호스트용 후기 API를 사용해주세요.");
        }
        if (mannerReviewRepository.existsByGroupBuyIdAndReviewerId(groupBuyId, reviewer.getId())) {
            throw new IllegalStateException("이미 평가를 제출했습니다.");
        }

        User reviewee = findUser(dto.getRevieweeId());
        if (!groupBuy.getHost().getId().equals(reviewee.getId())) {
            throw new IllegalArgumentException("참여자는 호스트만 평가할 수 있습니다.");
        }

        return buildAndSaveReview(groupBuy, reviewer, reviewee, MannerReview.ReviewerRole.BUYER, dto);
    }

    // 호스트 → 참여자 후기 제출 (참여자별 개별 작성)
    @Transactional
    public MannerReviewResponseDto submitHostReview(Long groupBuyId, String reviewerEmail, MannerReviewRequestDto dto) {
        User reviewer = findUserByEmail(reviewerEmail);
        GroupBuy groupBuy = findGroupBuy(groupBuyId);

        validateGroupBuyCompleted(groupBuy);
        validateReviewWindow(groupBuy);

        if (!groupBuy.getHost().getId().equals(reviewer.getId())) {
            throw new AccessDeniedException("호스트만 사용 가능한 API입니다.");
        }

        User reviewee = findUser(dto.getRevieweeId());
        if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, reviewee.getId())) {
            throw new IllegalArgumentException("해당 공동구매의 참여자가 아닙니다.");
        }
        if (mannerReviewRepository.existsByGroupBuyIdAndReviewerIdAndRevieweeId(groupBuyId, reviewer.getId(), reviewee.getId())) {
            throw new IllegalStateException("이미 해당 참여자에 대한 평가를 제출했습니다.");
        }

        return buildAndSaveReview(groupBuy, reviewer, reviewee, MannerReview.ReviewerRole.SELLER, dto);
    }

    @Transactional(readOnly = true)
    public List<ParticipantReviewStatusDto> getParticipantReviewStatuses(Long groupBuyId, String reviewerEmail) {
        User reviewer = findUserByEmail(reviewerEmail);
        GroupBuy groupBuy = findGroupBuy(groupBuyId);

        if (!groupBuy.getHost().getId().equals(reviewer.getId())) {
            throw new AccessDeniedException("호스트만 사용 가능한 API입니다.");
        }

        return participationRepository.findByGroupBuyIdWithPickupTime(groupBuyId).stream()
                .map(p -> {
                    boolean reviewed = mannerReviewRepository.existsByGroupBuyIdAndReviewerIdAndRevieweeId(
                            groupBuyId, reviewer.getId(), p.getParticipant().getId());
                    return new ParticipantReviewStatusDto(p, reviewed);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MannerReviewResponseDto> getReceivedReviews(Long userId) {
        return mannerReviewRepository.findByRevieweeId(userId).stream()
                .map(MannerReviewResponseDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MannerReviewResponseDto> getSentReviews(String reviewerEmail) {
        User reviewer = findUserByEmail(reviewerEmail);
        return mannerReviewRepository.findByReviewerId(reviewer.getId()).stream()
                .map(MannerReviewResponseDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewAvailabilityResponseDto canReview(Long groupBuyId, String reviewerEmail) {
        User reviewer = findUserByEmail(reviewerEmail);
        GroupBuy groupBuy = findGroupBuy(groupBuyId);

        boolean isHost = groupBuy.getHost().getId().equals(reviewer.getId());
        boolean isParticipant = participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, reviewer.getId());

        if (!isHost && !isParticipant) {
            throw new AccessDeniedException("해당 공동구매의 참여자만 후기를 작성할 수 있습니다.");
        }

        if (groupBuy.getCompletedAt() != null &&
                groupBuy.getCompletedAt().plusDays(REVIEW_WINDOW_DAYS).isBefore(LocalDateTime.now())) {
            return ReviewAvailabilityResponseDto.blocked(ReviewAvailabilityStatus.EXPIRED, "기한 만료");
        }

        if (isHost) {
            long totalParticipants = participationRepository.findByGroupBuyId(groupBuyId).size();
            long reviewedCount = mannerReviewRepository.countByGroupBuyIdAndReviewerId(groupBuyId, reviewer.getId());
            if (reviewedCount >= totalParticipants) {
                return ReviewAvailabilityResponseDto.blocked(ReviewAvailabilityStatus.ALREADY_REVIEWED, "작성 완료");
            }
        } else {
            if (mannerReviewRepository.existsByGroupBuyIdAndReviewerId(groupBuyId, reviewer.getId())) {
                return ReviewAvailabilityResponseDto.blocked(ReviewAvailabilityStatus.ALREADY_REVIEWED, "작성 완료");
            }
        }

        return ReviewAvailabilityResponseDto.canReview();
    }

    private MannerReviewResponseDto buildAndSaveReview(GroupBuy groupBuy, User reviewer, User reviewee,
                                                        MannerReview.ReviewerRole role, MannerReviewRequestDto dto) {
        if (reviewer.getId().equals(reviewee.getId())) {
            throw new IllegalArgumentException("자신을 평가할 수 없습니다.");
        }

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

    private double calculateDelta(MannerReview.Rating rating, int itemCount) {
        return switch (rating) {
            case BAD   -> itemCount * (-0.1);
            case GOOD  -> itemCount * 0.1;
            case GREAT -> itemCount * 0.2;
        };
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    private GroupBuy findGroupBuy(Long groupBuyId) {
        return groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
    }
}
