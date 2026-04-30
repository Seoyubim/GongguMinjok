package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Participation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    boolean existsByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);

    List<Participation> findByGroupBuyId(Long groupBuyId);

    List<Participation> findByParticipantId(Long participantId);

    Optional<Participation> findByGroupBuyIdAndParticipantEmail(Long groupBuyId, String email);

    void deleteByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);

    // Logic B: 결제 기한 초과 미확정 참여자 조회
    List<Participation> findByGroupBuyIdAndPaymentConfirmedFalseAndPaymentDeadlineBefore(
            Long groupBuyId, LocalDateTime now);
}
