package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class GroupBuyRequestDto {
    private String title;
    private String description;
    private GroupBuy.ProductType productType;
    private int totalPrice;
    private int totalQuantity;
    private int rewardPerUser;
    private int maxReward;
    private int maxParticipants;
    private String pickupLocation;
    private List<LocalDateTime> pickupTimes;
    private GroupBuy.Category category;
}