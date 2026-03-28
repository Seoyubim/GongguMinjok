package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification")
@Getter
@Setter
@NoArgsConstructor
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;       // 인증할 이메일

    @Column(nullable = false)
    private String code;        // 6자리 인증코드

    @Column(nullable = false)
    private LocalDateTime expiredAt;  // 만료시간 (5분)

    @Column(nullable = false)
    private boolean verified = false; // 인증 완료 여부

    public EmailVerification(String email, String code) {
        this.email = email;
        this.code = code;
        this.expiredAt = LocalDateTime.now().plusMinutes(5); // 5분 후 만료
    }

    // 만료됐는지 확인
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiredAt);
    }
}