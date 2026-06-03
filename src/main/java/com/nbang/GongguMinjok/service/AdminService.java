package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.Payment;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.admin.AdminBlockRequestDto;
import com.nbang.GongguMinjok.dto.admin.AdminGroupBuyDetailDto;
import com.nbang.GongguMinjok.dto.admin.AdminGroupBuyDto;
import com.nbang.GongguMinjok.dto.admin.AdminRefundDto;
import com.nbang.GongguMinjok.dto.admin.AdminSettlementDetailDto;
import com.nbang.GongguMinjok.dto.admin.AdminSettlementDto;
import com.nbang.GongguMinjok.dto.admin.AdminStatsDto;
import com.nbang.GongguMinjok.dto.admin.AdminUserDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.PaymentRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final String PICKUP_INCOMPLETE_REFUND_REASON = "픽업 미완료로 인한 공동구매 취소";
    private static final List<GroupBuy.Status> ACTIVE_GROUP_BUY_STATUSES = List.of(
            GroupBuy.Status.OPEN,
            GroupBuy.Status.CLOSING,
            GroupBuy.Status.CLOSED,
            GroupBuy.Status.PAYMENT_COMPLETED,
            GroupBuy.Status.HOST_PURCHASED,
            GroupBuy.Status.PICKUP_READY,
            GroupBuy.Status.PENDING
    );

    private final UserRepository userRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final ParticipationRepository participationRepository;
    private final PaymentRepository paymentRepository;

    public AdminStatsDto getStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1).minusNanos(1);

        long pendingSettlementCount = groupBuyRepository.countByStatusAndDeletedFalse(GroupBuy.Status.PENDING);
        long activeGroupBuyCount = groupBuyRepository.countByStatusInAndDeletedFalse(
                List.of(GroupBuy.Status.OPEN, GroupBuy.Status.CLOSING));
        long blockedUserCount = userRepository.countByMannerGrade(User.MannerGrade.BLOCKED);
        long todaySignupCount = userRepository.countByCreatedAtBetween(todayStart, todayEnd);

        return AdminStatsDto.builder()
                .pendingSettlementCount(pendingSettlementCount)
                .activeGroupBuyCount(activeGroupBuyCount)
                .blockedUserCount(blockedUserCount)
                .todaySignupCount(todaySignupCount)
                .build();
    }

    public List<AdminUserDto> getUsers(String filter) {
        List<User> users;
        if ("BLOCKED".equals(filter)) {
            users = userRepository.findByMannerGrade(User.MannerGrade.BLOCKED);
        } else if ("PREMIUM".equals(filter)) {
            users = userRepository.findByPremiumUntilAfter(LocalDateTime.now());
        } else {
            users = userRepository.findAll();
        }
        return users.stream()
                .filter(u -> u.getStatus() != User.UserStatus.WITHDRAWN)
                .map(this::toAdminUserDto)
                .collect(Collectors.toList());
    }

    public AdminUserDto getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        return toAdminUserDto(user);
    }

    @Transactional
    public void setUserBlock(Long userId, boolean block) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        if (block) {
            validateNoActiveGroupBuys(user);
            user.setStatus(User.UserStatus.SUSPENDED);
            user.setMannerScore(-1.0);
            user.setMannerGrade(User.MannerGrade.BLOCKED);
        } else {
            user.setStatus(User.UserStatus.ACTIVE);
            user.setMannerScore(50.0);
            user.setMannerGrade(User.MannerGrade.GOOD);
        }
        userRepository.save(user);
    }

    private void validateNoActiveGroupBuys(User user) {
        long hostedCount = groupBuyRepository.countByHostIdAndStatusInAndDeletedFalse(
                user.getId(), ACTIVE_GROUP_BUY_STATUSES);
        long participatingCount = participationRepository.countByParticipantIdAndActiveGroupBuyStatusIn(
                user.getId(), ACTIVE_GROUP_BUY_STATUSES);

        if (hostedCount > 0 || participatingCount > 0) {
            throw new IllegalStateException("진행 중인 공동구매가 있는 유저는 차단할 수 없습니다.");
        }
    }

    public List<AdminGroupBuyDto> getGroupBuys(String statusFilter) {
        List<GroupBuy> groupBuys;
        if (statusFilter != null && !statusFilter.isBlank()) {
            GroupBuy.Status status = GroupBuy.Status.valueOf(statusFilter);
            groupBuys = groupBuyRepository.findByStatusAndDeletedFalse(status);
        } else {
            groupBuys = groupBuyRepository.findAllByDeletedFalseOrderByCreatedAtDesc();
        }
        return groupBuys.stream()
                .map(this::toAdminGroupBuyDto)
                .collect(Collectors.toList());
    }

    public AdminGroupBuyDetailDto getGroupBuyDetail(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        List<Participation> participations = participationRepository.findByGroupBuyId(groupBuyId);

        List<AdminGroupBuyDetailDto.ParticipantInfo> participants = participations.stream()
                .map(p -> AdminGroupBuyDetailDto.ParticipantInfo.builder()
                        .nickname(p.getParticipant().getNickname())
                        .joinDate(p.getJoinedAt())
                        .statusLabel(resolveParticipantStatusLabel(p))
                        .build())
                .collect(Collectors.toList());

        List<AdminGroupBuyDetailDto.HistoryEntry> history = List.of(
                AdminGroupBuyDetailDto.HistoryEntry.builder()
                        .action("게시글 생성")
                        .date(groupBuy.getCreatedAt())
                        .build()
        );

        return AdminGroupBuyDetailDto.builder()
                .id(groupBuy.getId())
                .title(groupBuy.getTitle())
                .hostNickname(groupBuy.getHost().getNickname())
                .currentCount(groupBuy.getCurrentParticipants())
                .maxCount(groupBuy.getMaxParticipants())
                .deadline(groupBuy.getDeadline())
                .status(groupBuy.getStatus().name())
                .description(groupBuy.getDescription())
                .category(groupBuy.getCategory().name())
                .participants(participants)
                .history(history)
                .build();
    }

    @Transactional
    public void deleteGroupBuy(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        groupBuyRepository.delete(groupBuy);
    }

    public List<AdminSettlementDto> getSettlements(String filter) {
        List<GroupBuy> groupBuys;
        GroupBuy.Status status = parseSettlementStatus(filter);
        if (status != null) {
            groupBuys = groupBuyRepository.findByStatusAndDeletedFalse(status);
        } else {
            groupBuys = groupBuyRepository.findByStatusInAndDeletedFalse(
                    List.of(GroupBuy.Status.PENDING, GroupBuy.Status.COMPLETED));
        }
        return groupBuys.stream()
                .map(gb -> {
                    List<Participation> parts = participationRepository.findByGroupBuyId(gb.getId());
                    long pickupCompletedCount = parts.stream()
                            .filter(p -> p.getPickupCompletedAt() != null).count();
                    return AdminSettlementDto.builder()
                            .groupBuyId(gb.getId())
                            .title(gb.getTitle())
                            .hostNickname(gb.getHost().getNickname())
                            .participantCount(gb.getCurrentParticipants())
                            .totalAmount(gb.getUnitPrice() * gb.getCurrentParticipants())
                            .pickupCompletedCount((int) pickupCompletedCount)
                            .pickupTotalCount(parts.size())
                            .status(gb.getStatus().name())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public AdminSettlementDetailDto getSettlementDetail(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        validateSettlementStatus(groupBuy);
        List<Participation> participations = participationRepository.findByGroupBuyId(groupBuyId);

        long pickupCompletedCount = participations.stream()
                .filter(p -> p.getPickupCompletedAt() != null).count();

        List<AdminSettlementDetailDto.SettlementParticipantInfo> participantInfos = participations.stream()
                .map(p -> {
                    List<Payment> approved = paymentRepository.findByParticipationIdAndStatus(
                            p.getId(), Payment.Status.APPROVED);
                    int amount = approved.isEmpty()
                            ? groupBuy.getUnitPrice()
                            : approved.get(0).getAmount();
                    return AdminSettlementDetailDto.SettlementParticipantInfo.builder()
                            .nickname(p.getParticipant().getNickname())
                            .amount(amount)
                            .pickupCompleted(p.getPickupCompletedAt() != null)
                            .build();
                })
                .collect(Collectors.toList());

        return AdminSettlementDetailDto.builder()
                .groupBuyId(groupBuy.getId())
                .title(groupBuy.getTitle())
                .hostNickname(groupBuy.getHost().getNickname())
                .participantCount(groupBuy.getCurrentParticipants())
                .totalAmount(groupBuy.getUnitPrice() * groupBuy.getCurrentParticipants())
                .pickupCompletedCount((int) pickupCompletedCount)
                .pickupTotalCount(participations.size())
                .status(groupBuy.getStatus().name())
                .participants(participantInfos)
                .deadline(groupBuy.getDeadline())
                .pickupLocation(groupBuy.getPickupLocation())
                .build();
    }

    @Transactional
    public void completeSettlement(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        if (groupBuy.getStatus() != GroupBuy.Status.PENDING) {
            throw new IllegalStateException("정산 대기 상태에서만 정산 완료 처리할 수 있습니다.");
        }
        groupBuy.setStatus(GroupBuy.Status.COMPLETED);
        groupBuy.setCompletedAt(LocalDateTime.now());
        groupBuyRepository.save(groupBuy);
    }

    private GroupBuy.Status parseSettlementStatus(String filter) {
        if (filter == null || filter.isBlank()) {
            return null;
        }
        return switch (filter.trim().toUpperCase()) {
            case "PENDING" -> GroupBuy.Status.PENDING;
            case "COMPLETED" -> GroupBuy.Status.COMPLETED;
            default -> throw new IllegalArgumentException("정산 목록은 PENDING 또는 COMPLETED 상태만 조회할 수 있습니다.");
        };
    }

    private void validateSettlementStatus(GroupBuy groupBuy) {
        if (groupBuy.getStatus() != GroupBuy.Status.PENDING
                && groupBuy.getStatus() != GroupBuy.Status.COMPLETED) {
            throw new IllegalStateException("정산 대상 공동구매가 아닙니다.");
        }
    }

    public List<AdminRefundDto> getRefunds() {
        LocalDateTime now = LocalDateTime.now();
        List<AdminRefundDto> result = new ArrayList<>();

        // 환불 대기: PICKUP_READY + 마지막 픽업 +24h 경과 + 미픽업자 존재
        List<GroupBuy> pickupReadyList = groupBuyRepository.findByStatusAndDeletedFalse(GroupBuy.Status.PICKUP_READY);
        for (GroupBuy gb : pickupReadyList) {
            LocalDateTime latestPickup = gb.getPickupTimes().stream()
                    .map(GroupBuyPickupTime::getPickupTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            if (latestPickup == null || now.isBefore(latestPickup.plusHours(24))) {
                continue;
            }

            List<Participation> parts = participationRepository.findByGroupBuyId(gb.getId());
            long unpickedCount = parts.stream().filter(p -> p.getPickupCompletedAt() == null).count();
            if (unpickedCount == 0) {
                continue;
            }

            int refundTotal = paymentRepository.findByGroupBuyIdAndStatus(gb.getId(), Payment.Status.APPROVED)
                    .stream().mapToInt(Payment::getAmount).sum();
            long pickupCompletedCount = parts.stream().filter(p -> p.getPickupCompletedAt() != null).count();

            result.add(AdminRefundDto.builder()
                    .groupBuyId(gb.getId())
                    .title(gb.getTitle())
                    .hostNickname(gb.getHost().getNickname())
                    .hostMannerScore(gb.getHost().getMannerScore())
                    .participantCount(gb.getCurrentParticipants())
                    .pickupCompletedCount((int) pickupCompletedCount)
                    .pickupTotalCount(parts.size())
                    .pickupDeadline(latestPickup)
                    .refundTotal(refundTotal)
                    .refundStatus("환불대기")
                    .build());
        }

        // 환불 완료: 스케줄러가 실제 Toss 취소 후 CANCELED로 반영한 건
        List<GroupBuy> refundedList = paymentRepository
                .findByStatusAndFailReason(Payment.Status.CANCELED, PICKUP_INCOMPLETE_REFUND_REASON)
                .stream()
                .map(Payment::getGroupBuy)
                .filter(gb -> !gb.isDeleted())
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(GroupBuy::getId, gb -> gb, (left, right) -> left, LinkedHashMap::new),
                        map -> new ArrayList<>(map.values())));
        for (GroupBuy gb : refundedList) {
            List<Participation> parts = participationRepository.findByGroupBuyId(gb.getId());
            int refundTotal = paymentRepository.findByGroupBuyIdAndStatus(gb.getId(), Payment.Status.CANCELED)
                    .stream().mapToInt(Payment::getAmount).sum();
            long pickupCompletedCount = parts.stream().filter(p -> p.getPickupCompletedAt() != null).count();

            LocalDateTime latestPickup = gb.getPickupTimes().stream()
                    .map(GroupBuyPickupTime::getPickupTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            result.add(AdminRefundDto.builder()
                    .groupBuyId(gb.getId())
                    .title(gb.getTitle())
                    .hostNickname(gb.getHost().getNickname())
                    .hostMannerScore(gb.getHost().getMannerScore())
                    .participantCount(gb.getCurrentParticipants())
                    .pickupCompletedCount((int) pickupCompletedCount)
                    .pickupTotalCount(parts.size())
                    .pickupDeadline(latestPickup)
                    .refundTotal(refundTotal)
                    .refundStatus("환불완료")
                    .build());
        }

        return result;
    }

    private AdminUserDto toAdminUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .mannerScore(user.getMannerScore())
                .mannerGrade(user.getMannerGrade().name())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .premiumUntil(user.getPremiumUntil())
                .isPremium(user.isPremiumActive())
                .build();
    }

    private AdminGroupBuyDto toAdminGroupBuyDto(GroupBuy gb) {
        return AdminGroupBuyDto.builder()
                .id(gb.getId())
                .title(gb.getTitle())
                .hostNickname(gb.getHost().getNickname())
                .currentCount(gb.getCurrentParticipants())
                .maxCount(gb.getMaxParticipants())
                .deadline(gb.getDeadline())
                .status(gb.getStatus().name())
                .build();
    }

    private String resolveParticipantStatusLabel(Participation p) {
        if (p.getPickupCompletedAt() != null) return "픽업완료";
        if (p.isPaymentConfirmed()) return "결제완료";
        return "미결제";
    }
}
