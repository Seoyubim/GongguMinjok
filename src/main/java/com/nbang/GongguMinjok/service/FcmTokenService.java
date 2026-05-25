package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.FcmToken;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.repository.FcmTokenRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public void registerToken(String email, String token, String deviceType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        fcmTokenRepository.findByUserAndToken(user, token).ifPresentOrElse(
                existing -> {
                    existing.setActive(true);
                    fcmTokenRepository.save(existing);
                },
                () -> {
                    FcmToken fcmToken = new FcmToken();
                    fcmToken.setUser(user);
                    fcmToken.setToken(token);
                    fcmToken.setDeviceType(deviceType);
                    fcmToken.setActive(true);
                    fcmTokenRepository.save(fcmToken);
                }
        );
    }

    @Transactional
    public void deactivateToken(String email, String token) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        fcmTokenRepository.findByUserAndToken(user, token).ifPresent(t -> {
            t.setActive(false);
            fcmTokenRepository.save(t);
        });
    }
}
