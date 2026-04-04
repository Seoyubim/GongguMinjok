package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.EmailVerification;
import com.nbang.GongguMinjok.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationRepository emailVerificationRepository;

    // 인증코드 발송
    public void sendVerificationCode(String email) {

        // 6자리 랜덤 인증코드 생성
        String code = String.format("%06d", new Random().nextInt(999999));

        // DB에 저장
        EmailVerification verification = new EmailVerification(email, code);
        emailVerificationRepository.save(verification);

        // 이메일 발송
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[공구의민족] 이메일 인증코드");
        message.setText(
                "안녕하세요! 공구의민족입니다 🛒\n\n" +
                        "이메일 인증코드: " + code + "\n\n" +
                        "인증코드는 5분간 유효합니다.\n" +
                        "본인이 요청하지 않은 경우 무시해주세요."
        );
        mailSender.send(message);
    }

    // 인증코드 확인
    public boolean verifyCode(String email, String code) {

        // 가장 최근 인증코드 조회
        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByIdDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("인증코드를 먼저 요청해주세요!"));

        // 만료 확인
        if (verification.isExpired()) {
            throw new IllegalArgumentException("인증코드가 만료됐어요. 다시 요청해주세요!");
        }

        // 코드 일치 확인
        if (!verification.getCode().equals(code)) {
            throw new IllegalArgumentException("인증코드가 일치하지 않아요!");
        }

        // 인증 완료 처리
        verification.setVerified(true);
        emailVerificationRepository.save(verification);

        return true;
    }
}