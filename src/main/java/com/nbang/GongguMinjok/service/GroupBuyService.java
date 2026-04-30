package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyImage;
import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.DistanceRange;
import com.nbang.GongguMinjok.dto.GroupBuyRequestDto;
import com.nbang.GongguMinjok.dto.GroupBuyResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupBuyService {

    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;

    // 전체 목록 조회 (위치 필터/정렬 선택적 적용)
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getGroupBuys(Double userLat, Double userLng, DistanceRange distanceRange) {
        List<GroupBuy> all = groupBuyRepository.findAllByOrderByCreatedAtDesc();

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
                        case MEDIUM -> dist >= 1.0 && dist < 3.0;
                        case FAR    -> dist >= 3.0 && dist <= 5.0;
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
        GroupBuy groupBuy = groupBuyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        return new GroupBuyResponseDto(groupBuy);
    }

    // 생성
    @Transactional
    public GroupBuyResponseDto createGroupBuy(GroupBuyRequestDto dto, String email) {
        User host = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

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
        groupBuy.setCategory(dto.getCategory());
        groupBuy.setDeadline(dto.getDeadline());
        groupBuy.setMaxReward(15000);

        // save 전에 자식들 먼저 세팅
        for (LocalDateTime time : dto.getPickupTimes()) {
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
        GroupBuy groupBuy = groupBuyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("수정 권한이 없습니다.");
        }

        // OPEN 상태에서만 수정 허용 (CLOSING 이후 상태는 수정 불가)
        if (groupBuy.getStatus() != GroupBuy.Status.OPEN) {
            throw new IllegalStateException("OPEN 상태인 공동구매만 수정할 수 있습니다.");
        }

        // 허용 필드: title, description, pickupLocation/lat/lng/dongName, pickupTimes, deadline, imageUrls, category
        groupBuy.setTitle(dto.getTitle());
        groupBuy.setDescription(dto.getDescription());
        groupBuy.setPickupLocation(dto.getPickupLocation());
        groupBuy.setLat(dto.getLat());
        groupBuy.setLng(dto.getLng());
        groupBuy.setDongName(dto.getDongName());
        groupBuy.setCategory(dto.getCategory());

        // 마감일: 연장만 허용, 현재 마감일 기준 최대 7일
        if (dto.getDeadline() != null) {
            LocalDateTime current = groupBuy.getDeadline();
            LocalDateTime newDeadline = dto.getDeadline();
            if (newDeadline.isBefore(current)) {
                throw new IllegalArgumentException("마감일은 단축할 수 없습니다.");
            }
            if (newDeadline.isAfter(current.plusDays(7))) {
                throw new IllegalArgumentException("마감일은 현재 마감일로부터 최대 7일까지만 연장할 수 있습니다.");
            }
            groupBuy.setDeadline(newDeadline);
        }

        // 픽업 시간 교체 (orphanRemoval = true 로 기존 것 자동 삭제)
        groupBuy.getPickupTimes().clear();
        if (dto.getPickupTimes() != null) {
            for (LocalDateTime time : dto.getPickupTimes()) {
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

    // 삭제
    @Transactional
    public void deleteGroupBuy(Long id, String email) {
        GroupBuy groupBuy = groupBuyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (!groupBuy.getHost().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("삭제 권한이 없습니다.");
        }

        groupBuyRepository.delete(groupBuy);
    }

    // 특정 호스트가 올린 공동구매 목록
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getGroupBuysByHost(Long hostId) {
        return groupBuyRepository.findByHostId(hostId)
                .stream()
                .map(GroupBuyResponseDto::new)
                .collect(Collectors.toList());
    }

    // 내가 올린 공동구매 목록
    @Transactional(readOnly = true)
    public List<GroupBuyResponseDto> getMyGroupBuys(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        return groupBuyRepository.findByHostId(user.getId())
                .stream()
                .map(GroupBuyResponseDto::new)
                .collect(Collectors.toList());
    }
}