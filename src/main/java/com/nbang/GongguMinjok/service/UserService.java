package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.UserRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 회원가입
    public UserResponseDto register(UserRequestDto dto) {

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

        // User 엔티티 생성
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword())); // 비밀번호 암호화
        user.setNickname(dto.getNickname());
        user.setPhone(dto.getPhone());
        user.setLocation(dto.getLocation());

        // DB 저장
        User savedUser = userRepository.save(user);

        return new UserResponseDto(savedUser);
    }
}