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
    private String phone;        // 전화번호 (픽업 연락용)

    @Column(nullable = false)
    private String location;     // 동네 (예: 봉선동)

    @Column
    private String profileImage; // 프로필 사진 URL

    @Column(nullable = false)
    private int mannerScore = 50;  // 매너지수 기본값 50점

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MannerGrade mannerGrade = MannerGrade.SOSO;  // 매너등급

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;          // 권한 (기본값: USER)

    @Column(nullable = false)
    private boolean emailVerified = false;  // 이메일 인증 여부

    @Column(nullable = false)
    private boolean isActive = true;  // 계정 활성화 여부

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column
    private LocalDateTime updatedAt;

    // 매너등급 enum
    public enum MannerGrade {
        BAD,    // 0~49: 노쇼 등 부정적 평가 반영 시
        SOSO,   // 50~69: 기본 시작 등급
        GOOD,   // 70~89: 긍정 평가 누적 시
        GREAT,  // 90~99: 높은 신뢰도
        LEGEND // 100: 최상위 등급
    }

    // 권한
    public enum Role {
        USER,
        ADMIN
    }
}