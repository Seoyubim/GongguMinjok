package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PasswordChangeRequestDto {

    private String currentPassword;
    private String newPassword;
    private String newPasswordConfirm;
}
