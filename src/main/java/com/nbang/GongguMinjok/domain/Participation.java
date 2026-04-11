package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "participations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_buy_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_buy_id", nullable = false)
    private GroupBuy groupBuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User participant;

    // 결제 완료 여부
    @Column(nullable = false)
    private boolean paymentConfirmed = false;

    // 결제 확정 기한 (정원 충족 시각 + 24시간)
    @Column
    private LocalDateTime paymentDeadline;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime joinedAt;
}