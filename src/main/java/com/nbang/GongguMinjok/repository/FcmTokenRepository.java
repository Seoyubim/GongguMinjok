package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.FcmToken;
import com.nbang.GongguMinjok.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findByUserIdAndActiveTrue(Long userId);
    Optional<FcmToken> findByUserAndToken(User user, String token);
}
