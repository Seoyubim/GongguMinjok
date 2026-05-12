package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.MannerReview;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class MannerReviewRequestDto {

    private Long revieweeId;

    // BAD(별로예요) / GOOD(좋아요) / GREAT(최고예요)
    private MannerReview.Rating rating;

    private List<String> checkedItems;
}
