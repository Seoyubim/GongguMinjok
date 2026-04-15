package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private int maxParticipants;
    private String pickupLocation;
    private Double lat;
    private Double lng;
    private String dongName;
    private List<LocalDateTime> pickupTimes = new ArrayList<>(); // ← 기본값 빈 리스트
    private GroupBuy.Category category;
    private List<String> imageUrls = new ArrayList<>();           // ← 얘도 같이
    private LocalDateTime deadline;
}