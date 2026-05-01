package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.PremiumPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PremiumPaymentRepository extends JpaRepository<PremiumPayment, Long> {

    Optional<PremiumPayment> findByOrderId(String orderId);

    Optional<PremiumPayment> findTopByUserIdAndStatusOrderByRequestedAtDesc(
            Long userId, PremiumPayment.Status status);
}
