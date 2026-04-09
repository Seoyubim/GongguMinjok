package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.EmailVerification;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.UserRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.repository.EmailVerificationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.nbang.GongguMinjok.config.JwtTokenProvider;
import com.nbang.GongguMinjok.dto.LoginRequestDto;
import com.nbang.GongguMinjok.dto.LoginResponseDto;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public UserResponseDto register(UserRequestDto dto) {

        // 이메일 인증 확인
        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByIdDesc(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 인증을 먼저 해주세요!"));

        if (!verification.isVerified()) {
            throw new IllegalArgumentException("이메일 인증을 완료해주세요!");
        }

        // 중복 체크
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 사용중인 이메일이에요!");
        }
        if (userRepository.existsByPhone(dto.getPhone())) {
            throw new IllegalArgumentException("이미 사용중인 전화번호예요!");
        }
        if (userRepository.existsByNickname(dto.getNickname())) {
            throw new IllegalArgumentException("이미 사용중인 닉네임이에요!");
        }

        // 비밀번호 확인
        if (!dto.getPassword().equals(dto.getPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않아요!");
        }

        // User 생성
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname());
        user.setPhone(dto.getPhone());
        user.setLocation(dto.getLocation());
        user.setEmailVerified(true);

        User savedUser = userRepository.save(user);
        return new UserResponseDto(savedUser);
    }

    public LoginResponseDto login(LoginRequestDto dto) {

        // 이메일 존재 여부 확인
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일이에요!"));

        // 계정 활성화 여부 확인
        if (!user.isActive()) {
            throw new IllegalArgumentException("비활성화된 계정이에요!");
        }

        // 이메일 인증 여부 확인
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("이메일 인증이 필요해요!");
        }

        // 비밀번호 확인
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않아요!");
        }

        // JWT 발급
        String token = jwtTokenProvider.generateToken(user.getEmail());

        return LoginResponseDto.builder()
                .accessToken(token)
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .location(user.getLocation())
                .build();
    }
}