package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.User;
import lombok.Getter;

@Getter
public class UserResponseDto {

    private Long id;
    private String email;
    private String nickname;
    private String phone;
    private String location;
    private String profileImage;
    private int mannerScore;
    private String mannerGrade;

    // User 엔티티를 받아서 DTO로 변환
    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.phone = user.getPhone();
        this.location = user.getLocation();
        this.profileImage = user.getProfileImage();
        this.mannerScore = user.getMannerScore();
        this.mannerGrade = user.getMannerGrade().name();
    }
}