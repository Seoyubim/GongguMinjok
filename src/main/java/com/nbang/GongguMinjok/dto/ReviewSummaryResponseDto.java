package com.nbang.GongguMinjok.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class ReviewSummaryResponseDto {

    private final long reviewerCount;
    private final long reviewCount;
    private final List<ItemCountDto> itemCounts;

    public ReviewSummaryResponseDto(long reviewerCount, long reviewCount, List<ItemCountDto> itemCounts) {
        this.reviewerCount = reviewerCount;
        this.reviewCount = reviewCount;
        this.itemCounts = itemCounts;
    }

    @Getter
    public static class ItemCountDto {
        private final String item;
        private final long count;

        public ItemCountDto(String item, long count) {
            this.item = item;
            this.count = count;
        }
    }
}
