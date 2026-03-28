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
    private String passwordConfirm;  // 비밀번호 확인
    private String nickname;
    private String phone;
    private String location;
}