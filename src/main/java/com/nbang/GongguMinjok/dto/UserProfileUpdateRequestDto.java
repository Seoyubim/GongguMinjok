package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserProfileUpdateRequestDto {

    private String nickname;
    private String phone;
    private String location;
    private Double lat;
    private Double lng;
    private String cityName;
    private String profileImage;
}
