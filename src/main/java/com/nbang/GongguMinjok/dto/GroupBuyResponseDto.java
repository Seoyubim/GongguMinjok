package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyImage;
import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Comparator;

@Getter
public class GroupBuyResponseDto {
    private Long id;
    private String title;
    private String description;
    private String productType;
    private int totalPrice;
    private int totalQuantity;
    private int rewardPerUser;
    private int maxReward;
    private int maxParticipants;
    private int currentParticipants;
    private String pickupLocation;
    private Double lat;
    private Double lng;
    private String dongName;
    private List<LocalDateTime> pickupTimes;
    private String category;
    private List<String> imageUrls;
    private String status;
    private Long hostId;
    private String hostNickname;
    private LocalDateTime createdAt;

    public GroupBuyResponseDto(GroupBuy groupBuy) {
        this.id = groupBuy.getId();
        this.title = groupBuy.getTitle();
        this.description = groupBuy.getDescription();
        this.productType = groupBuy.getProductType().name();
        this.totalPrice = groupBuy.getTotalPrice();
        this.totalQuantity = groupBuy.getTotalQuantity();
        this.rewardPerUser = groupBuy.getRewardPerUser();
        this.maxReward = groupBuy.getMaxReward();
        this.maxParticipants = groupBuy.getMaxParticipants();
        this.currentParticipants = groupBuy.getCurrentParticipants();
        this.pickupLocation = groupBuy.getPickupLocation();
        this.lat = groupBuy.getLat();
        this.lng = groupBuy.getLng();
        this.dongName = groupBuy.getDongName();
        this.pickupTimes = groupBuy.getPickupTimes().stream()
                .map(GroupBuyPickupTime::getPickupTime)
                .collect(Collectors.toList());
        this.category = groupBuy.getCategory().name();
        this.imageUrls = groupBuy.getImages().stream()
                .sorted(Comparator.comparingInt(GroupBuyImage::getOrderIndex))
                .map(GroupBuyImage::getImageUrl)
                .collect(Collectors.toList());
        this.status = groupBuy.getStatus().name();
        this.hostId = groupBuy.getHost().getId();
        this.hostNickname = groupBuy.getHost().getNickname();
        this.createdAt = groupBuy.getCreatedAt();
    }
}