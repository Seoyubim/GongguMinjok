package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserRequestDto {

    private String email;
    private String password;
    private String nickname;
    private String phone;
    private String location;
}