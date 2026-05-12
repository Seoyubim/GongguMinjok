package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "manner_reviews",
    uniqueConstraints = @UniqueConstraint(columnNames = {"group_buy_id", "reviewer_id"})
)
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class MannerReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_buy_id", nullable = false)
    private GroupBuy groupBuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewerRole reviewerRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rating rating;

    @ElementCollection
    @CollectionTable(name = "manner_review_items", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "item", nullable = false)
    private List<String> checkedItems = new ArrayList<>();

    @Column(nullable = false)
    private double scoreDelta;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum ReviewerRole {
        BUYER,  // 구매자 → 판매자(호스트) 평가
        SELLER  // 판매자(호스트) → 구매자 평가
    }

    public enum Rating {
        BAD,   // 별로예요
        GOOD,  // 좋아요
        GREAT  // 최고예요
    }
}
