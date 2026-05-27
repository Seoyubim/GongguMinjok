package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BankAccountRequestDto {

    private String bankName;
    private String accountNumber;
    private String accountHolder;
}
