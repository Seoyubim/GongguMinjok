package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String content;

    @Column
    private Long relatedGroupBuyId;

    @Column(nullable = false)
    private boolean isRead = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        RECRUITMENT_CLOSED,   // 공동구매 정원 마감
        PAYMENT_REQUESTED,    // 결제 요청 발생
        HOST_PURCHASED,       // 호스트 상품 구매 완료
        PICKUP_READY,         // 픽업 준비 완료
        COMMENT_ON_MY_POST,   // 내 공동구매에 댓글
        SETTLEMENT_COMPLETED, // 전원 픽업 완료
        REVIEW_AVAILABLE      // 후기 작성 가능
    }
}
