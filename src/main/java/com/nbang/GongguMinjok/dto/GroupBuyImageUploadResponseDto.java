package com.nbang.GongguMinjok.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Getter
@RequiredArgsConstructor
public class GroupBuyImageUploadResponseDto {

    private final List<String> imageUrls;
}
