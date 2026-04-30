package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findTopByParticipationIdAndStatusOrderByRequestedAtDesc(
            Long participationId, Payment.Status status);

    List<Payment> findByParticipationIdAndStatus(Long participationId, Payment.Status status);
}
