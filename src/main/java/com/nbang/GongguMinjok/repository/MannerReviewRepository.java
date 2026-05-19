package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.MannerReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MannerReviewRepository extends JpaRepository<MannerReview, Long> {

    boolean existsByGroupBuyIdAndReviewerId(Long groupBuyId, Long reviewerId);

    List<MannerReview> findByReviewerId(Long reviewerId);

    List<MannerReview> findByRevieweeId(Long revieweeId);

    List<MannerReview> findByGroupBuyId(Long groupBuyId);
}
