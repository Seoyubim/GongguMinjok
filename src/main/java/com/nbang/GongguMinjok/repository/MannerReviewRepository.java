package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.MannerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MannerReviewRepository extends JpaRepository<MannerReview, Long> {

    boolean existsByGroupBuyIdAndReviewerId(Long groupBuyId, Long reviewerId);

    boolean existsByGroupBuyIdAndReviewerIdAndRevieweeId(Long groupBuyId, Long reviewerId, Long revieweeId);

    long countByGroupBuyIdAndReviewerId(Long groupBuyId, Long reviewerId);

    List<MannerReview> findByReviewerId(Long reviewerId);

    List<MannerReview> findByRevieweeId(Long revieweeId);

    @Query("""
        SELECT COUNT(DISTINCT r.reviewer.id)
        FROM MannerReview r
        WHERE r.reviewee.id = :revieweeId
    """)
    long countDistinctReviewersByRevieweeId(@Param("revieweeId") Long revieweeId);

    List<MannerReview> findByGroupBuyId(Long groupBuyId);
}
