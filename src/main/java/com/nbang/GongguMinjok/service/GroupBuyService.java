package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyImage;
import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.DistanceRange;
import com.nbang.GongguMinjok.dto.GroupBuyRequestDto;
import com.nbang.GongguMinjok.dto.GroupBuyResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupBuyService {

    private static final int MONTHLY_GROUP_BUY_LIMIT = 3;
    private static final int MIN_DEADLINE_DAYS_AFTER_CREATE = 3;
    private static final int MAX_DEADLINE_MONTHS_AFTER_CREATE = 3;

    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;
    private final ParticipationRepository participationRepository;

    // 전체 목록 조회 (위치 필터/정렬 선택적 적용)
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getGroupBuys(Double userLat, Double userLng, DistanceRange distanceRange) {
        List<GroupBuy> all = groupBuyRepository.findAllByDeletedFalseOrderByCreatedAtDesc();

        if (userLat == null || userLng == null) {
            return all.stream().map(GroupBuyResponseDto::new).collect(Collectors.toList());
        }

        return all.stream()
                .filter(gb -> gb.getLat() != null && gb.getLng() != null)
                .map(gb -> {
                    double dist = calculateDistance(userLat, userLng, gb.getLat(), gb.getLng());
                    GroupBuyResponseDto dto = new GroupBuyResponseDto(gb);
                    dto.setDistance(dist);
                    return dto;
                })
                .filter(dto -> {
                    if (distanceRange == null) return true;
                    double dist = dto.getDistance();
                    return switch (distanceRange) {
                        case NEAR   -> dist < 1.0;
                        case MEDIUM -> dist < 3.0;
                        case FAR    -> dist <= 5.0;
                    };
                })
                .sorted(Comparator.comparingDouble(GroupBuyResponseDto::getDistance))
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 단건 조회
    @Transactional(readOnly = true)
    public GroupBuyResponseDto getGroupBuy(Long id) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        return new GroupBuyResponseDto(groupBuy);
    }

    // 생성
    @Transactional
    public GroupBuyResponseDto createGroupBuy(GroupBuyRequestDto dto, String email) {
        User host = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        validateMonthlyGroupBuyLimit(host);
        validateGroupBuyQuantityPolicy(dto);

        LocalDateTime now = LocalDateTime.now();
        validateDeadlineOnCreate(dto.getDeadline(), now);

        GroupBuy groupBuy = new GroupBuy();
        groupBuy.setHost(host);
        groupBuy.setTitle(dto.getTitle());
        groupBuy.setDescription(dto.getDescription());
        groupBuy.setProductType(dto.getProductType());
        groupBuy.setTotalPrice(dto.getTotalPrice());
        groupBuy.setTotalQuantity(dto.getTotalQuantity());
        groupBuy.setMaxParticipants(dto.getMaxParticipants());
        groupBuy.setPickupLocation(dto.getPickupLocation());
        groupBuy.setLat(dto.getLat());
        groupBuy.setLng(dto.getLng());
        groupBuy.setDongName(dto.getDongName());
        groupBuy.setCityName(dto.getCityName());
        groupBuy.setCategory(dto.getCategory());
        groupBuy.setDeadline(dto.getDeadline());
        groupBuy.setOriginalDeadline(dto.getDeadline());
        groupBuy.setMaxReward(30000);

        // save 전에 자식들 먼저 세팅
        List<LocalDateTime> pickupTimes = dto.getPickupTimes() != null ? dto.getPickupTimes() : List.of();
        validatePickupTimesForCreate(pickupTimes, dto.getDeadline(), now);
        for (LocalDateTime time : pickupTimes) {
            GroupBuyPickupTime pickupTime = new GroupBuyPickupTime();
            pickupTime.setGroupBuy(groupBuy);  // 아직 id 없는 부모를 참조
            pickupTime.setPickupTime(time);
            groupBuy.getPickupTimes().add(pickupTime);
        }

        int order = 0;
        for (String url : dto.getImageUrls()) {
            GroupBuyImage image = new GroupBuyImage();
            image.setGroupBuy(groupBuy);
            image.setImageUrl(url);
            image.setOrderIndex(order++);
            groupBuy.getImages().add(image);
        }
        return new GroupBuyResponseDto(groupBuyRepository.save(groupBuy));
    }

    // 수정
    @Transactional
    public GroupBuyResponseDto updateGroupBuy(Long id, GroupBuyRequestDto dto, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("수정 권한이 없습니다.");
        }

        if (groupBuy.getHost().isRestricted()) {
            throw new IllegalStateException("매너점수 BLOCKED 등급은 공동구매 활동이 제한됩니다.");
        }

        GroupBuy.Status status = groupBuy.getStatus();

        if (status == GroupBuy.Status.CLOSING ||
                status == GroupBuy.Status.CLOSED ||
                status == GroupBuy.Status.PAYMENT_COMPLETED ||
                status == GroupBuy.Status.PENDING ||
                status == GroupBuy.Status.COMPLETED ||
                status == GroupBuy.Status.EXPIRED) {
            throw new IllegalStateException("현재 상태에서는 공동구매를 수정할 수 없습니다.");
        }

        List<Participation> participations = participationRepository.findByGroupBuyIdWithPickupTime(groupBuy.getId());
        boolean hasParticipants = !participations.isEmpty();
        LocalDateTime requestedDeadline = dto.getDeadline() != null ? dto.getDeadline() : groupBuy.getDeadline();
        boolean deadlineChanged = !requestedDeadline.equals(groupBuy.getDeadline());

        if (deadlineChanged) {
            validateDeadlineOnUpdate(groupBuy, requestedDeadline, hasParticipants);
        }
        if (status == GroupBuy.Status.HOST_PURCHASED || status == GroupBuy.Status.PICKUP_READY) {
            List<String> currentUrls = groupBuy.getImages().stream()
                    .sorted(Comparator.comparingInt(GroupBuyImage::getOrderIndex))
                    .map(GroupBuyImage::getImageUrl)
                    .collect(Collectors.toList());
            List<String> dtoUrls = dto.getImageUrls() != null ? dto.getImageUrls() : List.of();

            boolean otherFieldChanged =
                    !java.util.Objects.equals(dto.getTitle(), groupBuy.getTitle()) ||
                    !java.util.Objects.equals(dto.getDescription(), groupBuy.getDescription()) ||
                    !java.util.Objects.equals(dto.getPickupLocation(), groupBuy.getPickupLocation()) ||
                    !java.util.Objects.equals(dto.getLat(), groupBuy.getLat()) ||
                    !java.util.Objects.equals(dto.getLng(), groupBuy.getLng()) ||
                    !java.util.Objects.equals(dto.getDongName(), groupBuy.getDongName()) ||
                    !java.util.Objects.equals(dto.getDeadline(), groupBuy.getDeadline()) ||
                    dto.getCategory() != groupBuy.getCategory() ||
                    !currentUrls.equals(dtoUrls);

            if (otherFieldChanged) {
                throw new IllegalStateException("현재 상태에서는 픽업 시간만 수정할 수 있습니다.");
            }

            List<LocalDateTime> requestedPickupTimes = prepareRequestedPickupTimes(
                    dto.getPickupTimes(), groupBuy.getDeadline(), false);
            validatePickupTimesForUpdate(requestedPickupTimes, groupBuy.getDeadline(), groupBuy);
            Set<LocalDateTime> selectedByParticipants = participations
                    .stream()
                    .filter(p -> p.getPickupTime() != null)
                    .filter(p -> !p.getPickupTime().getPickupTime().isBefore(LocalDateTime.now()))
                    .map(p -> p.getPickupTime().getPickupTime())
                    .collect(Collectors.toSet());
            // 1. DTO 시간 + 참여자 선택 시간 합치기
            Set<LocalDateTime> mergedTimes = new TreeSet<>(requestedPickupTimes);
            mergedTimes.addAll(selectedByParticipants);

            // 2. 참여자 미선택 시간만 제거 (clear() 사용 금지)
            groupBuy.getPickupTimes().removeIf(
                existing -> !mergedTimes.contains(existing.getPickupTime())
            );

            // 3. 새로 추가된 시간만 insert
            Set<LocalDateTime> existingTimes = groupBuy.getPickupTimes().stream()
                .map(GroupBuyPickupTime::getPickupTime)
                .collect(Collectors.toSet());
            for (LocalDateTime time : mergedTimes) {
                if (!existingTimes.contains(time)) {
                    GroupBuyPickupTime pickupTime = new GroupBuyPickupTime();
                    pickupTime.setGroupBuy(groupBuy);
                    pickupTime.setPickupTime(time);
                    groupBuy.getPickupTimes().add(pickupTime);
                }
            }

            return new GroupBuyResponseDto(groupBuyRepository.save(groupBuy));
        }

        // OPEN
        groupBuy.setTitle(dto.getTitle());
        groupBuy.setDescription(dto.getDescription());
        groupBuy.setPickupLocation(dto.getPickupLocation());
        groupBuy.setLat(dto.getLat());
        groupBuy.setLng(dto.getLng());
        groupBuy.setDongName(dto.getDongName());
        groupBuy.setCityName(dto.getCityName());
        groupBuy.setDeadline(requestedDeadline);
        groupBuy.setCategory(dto.getCategory());

        // 픽업 시간 교체 (orphanRemoval = true 로 기존 것 자동 삭제)
        List<LocalDateTime> requestedPickupTimes = prepareRequestedPickupTimes(
                dto.getPickupTimes(), requestedDeadline, deadlineChanged);
        validatePickupTimesForUpdate(requestedPickupTimes, requestedDeadline, groupBuy);
        Set<LocalDateTime> selectedByParticipants = participations
                .stream()
                .filter(p -> p.getPickupTime() != null)
                .filter(p -> !p.getPickupTime().getPickupTime().isBefore(LocalDateTime.now()))
                .map(p -> p.getPickupTime().getPickupTime())
                .collect(Collectors.toSet());
        // 1. DTO 시간 + 참여자 선택 시간 합치기
        Set<LocalDateTime> mergedTimes = new TreeSet<>(requestedPickupTimes);
        mergedTimes.addAll(selectedByParticipants);

        // 2. 참여자 미선택 시간만 제거 (clear() 사용 금지)
        groupBuy.getPickupTimes().removeIf(
            existing -> !mergedTimes.contains(existing.getPickupTime())
        );

        // 3. 새로 추가된 시간만 insert
        Set<LocalDateTime> existingTimes = groupBuy.getPickupTimes().stream()
            .map(GroupBuyPickupTime::getPickupTime)
            .collect(Collectors.toSet());
        for (LocalDateTime time : mergedTimes) {
            if (!existingTimes.contains(time)) {
                GroupBuyPickupTime pickupTime = new GroupBuyPickupTime();
                pickupTime.setGroupBuy(groupBuy);
                pickupTime.setPickupTime(time);
                groupBuy.getPickupTimes().add(pickupTime);
            }
        }

        groupBuy.getImages().clear();
        if (dto.getImageUrls() != null) {
            int order = 0;
            for (String url : dto.getImageUrls()) {
                GroupBuyImage image = new GroupBuyImage();
                image.setGroupBuy(groupBuy);
                image.setImageUrl(url);
                image.setOrderIndex(order++);
                groupBuy.getImages().add(image);
            }
        }

        return new GroupBuyResponseDto(groupBuyRepository.save(groupBuy));
    }

    @Transactional
    public GroupBuyResponseDto completeHostPurchase(Long id, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("호스트만 주문 완료 처리할 수 있습니다.");
        }

        if (groupBuy.getStatus() != GroupBuy.Status.PAYMENT_COMPLETED) {
            throw new IllegalStateException("전원 결제 완료 상태에서만 주문 완료 처리할 수 있습니다.");
        }

        groupBuy.setStatus(GroupBuy.Status.HOST_PURCHASED);
        return new GroupBuyResponseDto(groupBuyRepository.save(groupBuy));
    }

    @Transactional
    public GroupBuyResponseDto markPickupReady(Long id, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("호스트만 수령 완료 처리할 수 있습니다.");
        }

        if (groupBuy.getStatus() != GroupBuy.Status.HOST_PURCHASED) {
            throw new IllegalStateException("호스트 주문 완료 상태에서만 수령 완료 처리할 수 있습니다.");
        }

        groupBuy.setStatus(GroupBuy.Status.PICKUP_READY);
        return new GroupBuyResponseDto(groupBuyRepository.save(groupBuy));
    }

    private void validatePaymentAmountChange(GroupBuy groupBuy, GroupBuyRequestDto dto) {
        if (!groupBuy.isPaymentAmountFixed()) {
            return;
        }

        boolean amountChanged = groupBuy.getTotalPrice() != dto.getTotalPrice()
                || groupBuy.getTotalQuantity() != dto.getTotalQuantity()
                || groupBuy.getMaxParticipants() != dto.getMaxParticipants();

        if (amountChanged) {
            throw new IllegalStateException("Payment amount is already fixed. Price, quantity, and max participants cannot be changed.");
        }
    }

    // 삭제
    private void validateGroupBuyQuantityPolicy(GroupBuyRequestDto dto) {
        if (dto.getMaxParticipants() <= 0) {
            throw new IllegalArgumentException("모집 인원은 1명 이상이어야 합니다.");
        }

        if (dto.getTotalQuantity() <= 0) {
            throw new IllegalArgumentException("총 수량은 1개 이상이어야 합니다.");
        }

        if (dto.getTotalQuantity() % dto.getMaxParticipants() != 0) {
            throw new IllegalArgumentException("총 수량은 모집 인원수로 나누어 떨어져야 합니다.");
        }
    }

    private void validateDeadlineOnCreate(LocalDateTime deadline, LocalDateTime createdAt) {
        if (deadline == null) {
            throw new IllegalArgumentException("마감일을 입력해 주세요.");
        }
        if (deadline.toLocalDate().isBefore(createdAt.toLocalDate().plusDays(MIN_DEADLINE_DAYS_AFTER_CREATE))) {
            throw new IllegalArgumentException("마감일은 생성일로부터 3일 이후여야 합니다.");
        }
        if (deadline.toLocalDate().isAfter(createdAt.toLocalDate().plusMonths(MAX_DEADLINE_MONTHS_AFTER_CREATE))) {
            throw new IllegalArgumentException("마감일은 생성 시점으로부터 최대 3개월 이내여야 합니다.");
        }
    }

    private void validateDeadlineOnUpdate(GroupBuy groupBuy, LocalDateTime deadline, boolean hasParticipants) {
        if (deadline == null) {
            throw new IllegalArgumentException("마감일을 입력해 주세요.");
        }
        if (hasParticipants) {
            throw new IllegalStateException("참여자가 한 명이라도 있으면 마감일을 수정할 수 없습니다.");
        }

        LocalDateTime createdAt = groupBuy.getCreatedAt() != null
                ? groupBuy.getCreatedAt()
                : LocalDateTime.now();
        validateDeadlineOnCreate(deadline, createdAt);
    }

    private List<LocalDateTime> prepareRequestedPickupTimes(
            List<LocalDateTime> pickupTimes, LocalDateTime deadline, boolean deadlineChanged) {
        List<LocalDateTime> requested = pickupTimes != null ? pickupTimes : List.of();

        return requested.stream()
                .filter(time -> time != null)
                .filter(time -> !deadlineChanged || time.isAfter(deadline))
                .distinct()
                .collect(Collectors.toList());
    }

    private void validatePickupTimesForCreate(
            List<LocalDateTime> pickupTimes, LocalDateTime deadline, LocalDateTime now) {
        LocalDateTime maxAllowed = deadline.plusDays(14);

        for (LocalDateTime time : pickupTimes) {
            if (time.isBefore(now)) {
                throw new IllegalArgumentException("픽업 시간은 현재 시간 이후여야 합니다.");
            }
            validatePickupTimeRange(time, deadline, maxAllowed);
        }
    }

    private void validatePickupTimesForUpdate(
            List<LocalDateTime> pickupTimes, LocalDateTime deadline, GroupBuy groupBuy) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maxAllowed = deadline.plusDays(14);
        Set<LocalDateTime> existingTimes = groupBuy.getPickupTimes().stream()
                .map(GroupBuyPickupTime::getPickupTime)
                .collect(Collectors.toSet());

        for (LocalDateTime time : pickupTimes) {
            if (time.isBefore(now) && !existingTimes.contains(time)) {
                throw new IllegalArgumentException("새 픽업 시간은 현재 시간 이후여야 합니다.");
            }
            validatePickupTimeRange(time, deadline, maxAllowed);
        }
    }

    private void validatePickupTimeRange(
            LocalDateTime pickupTime, LocalDateTime deadline, LocalDateTime maxAllowed) {
        if (!pickupTime.isAfter(deadline)) {
            throw new IllegalArgumentException("픽업 시간은 마감일 이후여야 합니다.");
        }
        if (pickupTime.isAfter(maxAllowed)) {
            throw new IllegalArgumentException("픽업 시간은 마감일로부터 14일 이내여야 합니다.");
        }
    }

    private void validateMonthlyGroupBuyLimit(User host) {
        if (host.isPremiumActive()) {
            return;
        }

        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = currentMonth.plusMonths(1).atDay(1).atStartOfDay();

        long monthlyCount = groupBuyRepository
                .countByHostIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        host.getId(), startOfMonth, startOfNextMonth);

        if (monthlyCount >= MONTHLY_GROUP_BUY_LIMIT) {
            throw new IllegalStateException("무료 사용자는 한 달에 공동구매 게시글을 3개까지만 작성할 수 있습니다.");
        }
    }

    @Transactional
    public void deleteGroupBuy(Long id, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("삭제 권한이 없습니다.");
        }

        groupBuy.setDeleted(true);
        groupBuy.setDeletedAt(LocalDateTime.now());
        groupBuyRepository.save(groupBuy);
    }

    // 특정 호스트가 올린 공동구매 목록
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getGroupBuysByHost(Long hostId) {
        return groupBuyRepository.findByHostIdAndDeletedFalse(hostId)
                .stream()
                .map(GroupBuyResponseDto::new)
                .collect(Collectors.toList());
    }

    // 키워드 검색
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> searchGroupBuys(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return groupBuyRepository.searchByKeyword(keyword.trim())
                .stream()
                .map(GroupBuyResponseDto::new)
                .collect(Collectors.toList());
    }

    // 내가 올린 공동구매 목록
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getMyGroupBuys(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        return groupBuyRepository.findByHostIdAndDeletedFalse(user.getId())
                .stream()
                .map(GroupBuyResponseDto::new)
                .collect(Collectors.toList());
    }
}
