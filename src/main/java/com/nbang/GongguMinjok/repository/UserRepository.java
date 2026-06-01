package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByNickname(String nickname);

    long countByMannerGrade(User.MannerGrade grade);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<User> findByMannerGrade(User.MannerGrade grade);
    List<User> findByPremiumUntilAfter(LocalDateTime now);
}