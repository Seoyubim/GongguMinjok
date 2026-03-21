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

    @Column(nullable = false)
    private String nickname;

    @Column(nullable = false, unique = true)
    private String phone;        // 전화번호 (픽업 연락용)

    @Column(nullable = false)
    private String location;     // 동네 (예: 봉선동)

    @Column
    private String profileImage; // 프로필 사진 URL

    @Column(nullable = false)
    private int mannerScore = 100;  // 매너지수 기본값 100점

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MannerGrade mannerGrade = MannerGrade.NEW;  // 매너등급

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
        NEW,          // 새로운 이웃 (0~49점)
        GOOD,         // 좋은 이웃 (50~69점)
        TRUST,        // 믿음직한 이웃 (70~89점)
        GREAT,        // 씩씩한 이웃 (90~99점)
        LEGEND        // 전설의 이웃 (100점 이상)
    }
}