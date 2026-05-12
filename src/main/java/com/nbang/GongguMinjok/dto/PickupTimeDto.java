package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuyPickupTime;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PickupTimeDto {
    private Long id;
    private LocalDateTime pickupTime;

    public PickupTimeDto(GroupBuyPickupTime pickupTime) {
        this.id = pickupTime.getId();
        this.pickupTime = pickupTime.getPickupTime();
    }
}
