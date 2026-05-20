package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponseDto {

    private Long id;
    private String email;
    private String nickname;
    private String phone;
    private String location;
    private Double lat;
    private Double lng;
    private String cityName;
    private String profileImage;
    private double mannerScore;
    private String mannerGrade;
    private boolean premiumActive;
    private LocalDateTime premiumUntil;
    private long monthlyGroupBuyCreateCount;
    private Integer monthlyGroupBuyCreateLimit;

    // User 엔티티를 받아서 DTO로 변환
    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.phone = user.getPhone();
        this.location = user.getLocation();
        this.lat = user.getLat();
        this.lng = user.getLng();
        this.cityName = user.getCityName();
        this.profileImage = user.getProfileImage();
        this.mannerScore = user.getMannerScore();
        this.mannerGrade = user.getMannerGrade().name();
        this.premiumActive = user.isPremiumActive();
        this.premiumUntil = user.getPremiumUntil();
        this.monthlyGroupBuyCreateCount = 0;
        this.monthlyGroupBuyCreateLimit = user.isPremiumActive() ? null : 3;
    }

    public UserResponseDto(User user, long monthlyGroupBuyCreateCount, Integer monthlyGroupBuyCreateLimit) {
        this(user);
        this.monthlyGroupBuyCreateCount = monthlyGroupBuyCreateCount;
        this.monthlyGroupBuyCreateLimit = monthlyGroupBuyCreateLimit;
    }
}
