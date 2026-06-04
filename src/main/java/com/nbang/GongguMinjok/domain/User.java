package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private String location;

    @Column
    private Double lat;

    @Column
    private Double lng;

    @Column(length = 50)
    private String cityName;

    @Column(columnDefinition = "TEXT")
    private String profileImage;

    // double로 저장 (0.1 단위 소수점 처리)
    // 기존 INT 컬럼이 있다면: ALTER TABLE users MODIFY COLUMN manner_score DOUBLE DEFAULT 50.0;
    @Column(nullable = false)
    private double mannerScore = 50.0;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MannerGrade mannerGrade = MannerGrade.GOOD;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;

    @Column
    private LocalDateTime withdrawnAt;

    @Column
    private String bankName;

    @Column
    private String accountNumber;

    @Column
    private String accountHolder;

    public boolean hasBankAccount() {
        return bankName != null && !bankName.isBlank()
                && accountNumber != null && !accountNumber.isBlank()
                && accountHolder != null && !accountHolder.isBlank();
    }

    @Column
    private LocalDateTime premiumUntil;

    public enum UserStatus {
        ACTIVE,     // 정상
        SUSPENDED,  // 정지 (관리자)
        WITHDRAWN   // 탈퇴
    }

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column
    private LocalDateTime updatedAt;

    public enum MannerGrade {
        BLOCKED, // score < 0: 모든 공동구매 쓰기 활동 제한
        BAD,     // 0~29
        SOSO,    // 30~49
        GOOD,    // 50~69 (계정 생성 기본값)
        GREAT,   // 70~89
        LEGEND   // 90~100
    }

    public enum Role {
        USER,
        ADMIN
    }

    public void updateMannerScore(double delta) {
        double updated = Math.min(100.0, this.mannerScore + delta);
        this.mannerScore = updated;
        this.mannerGrade = resolveGrade(updated);
    }

    private static MannerGrade resolveGrade(double score) {
        if (score < 0)  return MannerGrade.BLOCKED;
        if (score < 30) return MannerGrade.BAD;
        if (score < 50) return MannerGrade.SOSO;
        if (score < 70) return MannerGrade.GOOD;
        if (score < 90) return MannerGrade.GREAT;
        return MannerGrade.LEGEND;
    }

    public boolean isRestricted() {
        return this.mannerGrade == MannerGrade.BLOCKED;
    }

    public boolean isPremiumActive() {
        return premiumUntil != null && premiumUntil.isAfter(LocalDateTime.now());
    }
}
