package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.EmailVerification;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.PasswordChangeRequestDto;
import com.nbang.GongguMinjok.dto.UserProfileUpdateRequestDto;
import com.nbang.GongguMinjok.dto.UserRequestDto;
import com.nbang.GongguMinjok.dto.UserResponseDto;
import com.nbang.GongguMinjok.repository.EmailVerificationRepository;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.nbang.GongguMinjok.config.JwtTokenProvider;
import com.nbang.GongguMinjok.dto.LoginRequestDto;
import com.nbang.GongguMinjok.dto.LoginResponseDto;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MONTHLY_GROUP_BUY_LIMIT = 3;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public UserResponseDto getMyProfile(String email) {
        User user = findActiveUserByEmail(email);
        return toUserResponseDto(user);
    }

    public UserResponseDto updateMyProfile(String email, UserProfileUpdateRequestDto dto) {
        User user = findActiveUserByEmail(email);

        String nickname = normalize(dto.getNickname());
        String phone = normalize(dto.getPhone());
        String location = normalize(dto.getLocation());
        String profileImage = normalize(dto.getProfileImage());
        String cityName = normalize(dto.getCityName());

        if (nickname == null) {
            throw new IllegalArgumentException("닉네임을 입력해 주세요.");
        }
        if (phone == null) {
            throw new IllegalArgumentException("전화번호를 입력해 주세요.");
        }
        if (location == null) {
            throw new IllegalArgumentException("주소를 입력해 주세요.");
        }

        if (!nickname.equals(user.getNickname()) && userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }
        if (!phone.equals(user.getPhone()) && userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("이미 사용중인 전화번호입니다.");
        }

        user.setNickname(nickname);
        user.setPhone(phone);
        user.setLocation(location);
        user.setLat(dto.getLat());
        user.setLng(dto.getLng());
        user.setCityName(cityName);
        user.setProfileImage(profileImage);

        return toUserResponseDto(userRepository.save(user));
    }

    public void changeMyPassword(String email, PasswordChangeRequestDto dto) {
        User user = findActiveUserByEmail(email);

        if (isBlank(dto.getCurrentPassword())) {
            throw new IllegalArgumentException("현재 비밀번호를 입력해 주세요.");
        }
        if (isBlank(dto.getNewPassword())) {
            throw new IllegalArgumentException("새 비밀번호를 입력해 주세요.");
        }
        if (!dto.getNewPassword().equals(dto.getNewPasswordConfirm())) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }
        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

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
        user.setLat(dto.getLat());
        user.setLng(dto.getLng());
        user.setCityName(dto.getCityName());
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
                .premiumActive(user.isPremiumActive())
                .premiumUntil(user.getPremiumUntil())
                .build();
    }

    private User findActiveUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!user.isActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        return user;
    }

    private UserResponseDto toUserResponseDto(User user) {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime startOfNextMonth = currentMonth.plusMonths(1).atDay(1).atStartOfDay();

        long monthlyCount = groupBuyRepository
                .countByHostIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        user.getId(), startOfMonth, startOfNextMonth);
        Integer monthlyLimit = user.isPremiumActive() ? null : MONTHLY_GROUP_BUY_LIMIT;

        return new UserResponseDto(user, monthlyCount, monthlyLimit);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
