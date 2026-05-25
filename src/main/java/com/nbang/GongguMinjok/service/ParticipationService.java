package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import com.nbang.GongguMinjok.domain.Notification;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.ParticipationResponseDto;
import com.nbang.GongguMinjok.dto.PickupResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ParticipationResponseDto join(Long groupBuyId, String email) {
        return join(groupBuyId, email, null);
    }

    @Transactional
    public ParticipationResponseDto join(Long groupBuyId, String email, Long pickupTimeId) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (groupBuy.getStatus() != GroupBuy.Status.OPEN
                && groupBuy.getStatus() != GroupBuy.Status.CLOSING) {
            throw new IllegalArgumentException("참여할 수 없는 공동구매입니다.");
        }

        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (groupBuy.getHost().getId().equals(participant.getId())) {
            throw new IllegalArgumentException("호스트는 참여할 수 없습니다.");
        }

        if (participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, participant.getId())) {
            throw new IllegalArgumentException("이미 참여한 공동구매입니다.");
        }

        if (groupBuy.getCurrentParticipants() >= groupBuy.getMaxParticipants()) {
            throw new IllegalArgumentException("정원이 초과되었습니다.");
        }

        Participation participation = new Participation();
        participation.setGroupBuy(groupBuy);
        participation.setParticipant(participant);
        if (pickupTimeId != null) {
            GroupBuyPickupTime pickupTime = groupBuy.getPickupTimes().stream()
                    .filter(time -> time.getId().equals(pickupTimeId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("해당 공동구매의 픽업 시간이 아닙니다."));
            participation.setPickupTime(pickupTime);
        }
        participationRepository.save(participation);

        groupBuy.setCurrentParticipants(groupBuy.getCurrentParticipants() + 1);

        if (groupBuy.getCurrentParticipants() == groupBuy.getMaxParticipants()) {
            groupBuy.fixPaymentAmounts(LocalDateTime.now().plusHours(24));

            // 정원 충족 시점에 금액 확정
            int participantAmount = groupBuy.getFixedParticipantPaymentAmount();

            // 결제 기한: 정원 충족 시각 + 24시간
            LocalDateTime paymentDeadline = groupBuy.getPaymentDeadline();
            List<Participation> participations = participationRepository.findByGroupBuyId(groupBuyId);
            participations.forEach(p -> {
                p.setPaymentDeadline(paymentDeadline);
                p.setPaymentAmount(participantAmount);
            });
            participationRepository.saveAll(participations);

            // 정원 마감 알림 (RECRUITMENT_CLOSED) — 호스트에게
            notificationService.sendNotification(
                    groupBuy.getHost().getId(),
                    Notification.NotificationType.RECRUITMENT_CLOSED,
                    "공동구매 정원이 모두 찼어요",
                    groupBuy.getTitle() + " 정원이 모두 찼습니다. 공동구매가 진행됩니다.",
                    groupBuy.getId()
            );

            // 결제 요청 알림 (PAYMENT_REQUESTED)
            participations.forEach(p -> notificationService.sendNotification(
                    p.getParticipant().getId(),
                    Notification.NotificationType.PAYMENT_REQUESTED,
                    "결제 요청이 도착했어요",
                    groupBuy.getTitle() + " 공동구매 결제를 완료해주세요.",
                    groupBuy.getId()
            ));
        }

        groupBuyRepository.save(groupBuy);

        return ParticipationResponseDto.from(participation);
    }

    @Transactional
    public void cancel(Long groupBuyId, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, participant.getId())) {
            throw new IllegalArgumentException("참여하지 않은 공동구매입니다.");
        }

        GroupBuy.Status currentStatus = groupBuy.getStatus();
        if (currentStatus != GroupBuy.Status.OPEN
                && currentStatus != GroupBuy.Status.CLOSING) {
            throw new IllegalArgumentException("모집 중인 공동구매만 취소할 수 있습니다.");
        }

        participationRepository.deleteByGroupBuyIdAndParticipantId(groupBuyId, participant.getId());

        groupBuy.setCurrentParticipants(groupBuy.getCurrentParticipants() - 1);
        groupBuy.setStatus(currentStatus);
        groupBuyRepository.save(groupBuy);
    }

    @Transactional
    public ParticipationResponseDto updatePickupTime(Long groupBuyId, String email, Long pickupTimeId) {
        if (pickupTimeId == null) {
            throw new IllegalArgumentException("픽업 시간을 선택해주세요.");
        }

        Participation participation = participationRepository
                .findByGroupBuyIdAndParticipantEmail(groupBuyId, email)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException(
                        "해당 공동구매 참여자만 픽업 시간을 수정할 수 있습니다."));

        GroupBuy groupBuy = participation.getGroupBuy();
        if (!canParticipantChangePickupTime(groupBuy.getStatus())) {
            throw new IllegalStateException("현재 공동구매 상태에서는 픽업 시간을 수정할 수 없습니다.");
        }

        if (participation.getPickupCompletedAt() != null) {
            throw new IllegalStateException("이미 픽업 완료 처리되었습니다.");
        }

        GroupBuyPickupTime pickupTime = groupBuy.getPickupTimes().stream()
                .filter(time -> time.getId().equals(pickupTimeId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 공동구매의 픽업 시간이 아닙니다."));

        if (pickupTime.getPickupTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("지난 픽업 시간으로는 변경할 수 없습니다.");
        }

        participation.setPickupTime(pickupTime);
        return ParticipationResponseDto.from(participationRepository.save(participation));
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponseDto> getParticipants(Long groupBuyId) {
        return participationRepository.findByGroupBuyId(groupBuyId).stream()
                .map(ParticipationResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponseDto> getMyParticipations(String email) {
        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        return participationRepository.findByParticipantId(participant.getId()).stream()
                .map(ParticipationResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public PickupResponseDto completePickup(Long groupBuyId, String email) {
        Participation participation = participationRepository
                .findByGroupBuyIdAndParticipantEmail(groupBuyId, email)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("해당 공동구매 참여자만 픽업 완료 처리할 수 있습니다."));

        GroupBuy groupBuy = participation.getGroupBuy();
        if (groupBuy.getStatus() != GroupBuy.Status.PICKUP_READY) {
            throw new IllegalStateException("픽업 가능 상태가 아닙니다.");
        }

        if (participation.getPickupCompletedAt() != null) {
            throw new IllegalStateException("이미 픽업 완료 처리되었습니다.");
        }

        participation.setPickupCompletedAt(LocalDateTime.now());
        participationRepository.save(participation);

        List<Participation> allParticipations = participationRepository.findByGroupBuyId(groupBuyId);
        int expectedParticipantCount = groupBuy.getMaxParticipants() - 1;
        boolean allCompleted = allParticipations.size() == expectedParticipantCount
                && allParticipations.stream()
                .allMatch(p -> p.getPickupCompletedAt() != null);

        if (allCompleted) {
            groupBuy.setStatus(GroupBuy.Status.PENDING);
            groupBuyRepository.save(groupBuy);

            // 정산 완료 알림 — 호스트에게
            notificationService.sendNotification(
                    groupBuy.getHost().getId(),
                    Notification.NotificationType.SETTLEMENT_COMPLETED,
                    "정산이 완료됐어요",
                    groupBuy.getTitle() + " 공동구매 정산이 완료되었습니다.",
                    groupBuy.getId()
            );

            // 후기 작성 가능 알림 — 참여자 전원에게
            allParticipations.forEach(p -> notificationService.sendNotification(
                    p.getParticipant().getId(),
                    Notification.NotificationType.REVIEW_AVAILABLE,
                    "후기를 작성해주세요",
                    groupBuy.getTitle() + " 공동구매가 완료되었습니다. 후기를 남겨보세요!",
                    groupBuy.getId()
            ));

            // 후기 작성 가능 알림 — 호스트에게
            notificationService.sendNotification(
                    groupBuy.getHost().getId(),
                    Notification.NotificationType.REVIEW_AVAILABLE,
                    "후기를 작성해주세요",
                    groupBuy.getTitle() + " 공동구매가 완료되었습니다. 참여자에게 후기를 남겨보세요!",
                    groupBuy.getId()
            );
        }

        return new PickupResponseDto(
                participation.getId(),
                participation.getPickupCompletedAt(),
                allCompleted,
                groupBuy.getStatus().name());
    }

    private boolean canParticipantChangePickupTime(GroupBuy.Status status) {
        return status == GroupBuy.Status.OPEN
                || status == GroupBuy.Status.HOST_PURCHASED
                || status == GroupBuy.Status.PICKUP_READY;
    }

}
