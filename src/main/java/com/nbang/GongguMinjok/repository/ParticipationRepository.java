package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.GroupBuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    boolean existsByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);

    long countByParticipantId(Long participantId);

    List<Participation> findByGroupBuyId(Long groupBuyId);

    @Query("""
        SELECT p
        FROM Participation p
        LEFT JOIN FETCH p.pickupTime
        WHERE p.groupBuy.id = :groupBuyId
    """)
    List<Participation> findByGroupBuyIdWithPickupTime(@Param("groupBuyId") Long groupBuyId);

    List<Participation> findByParticipantId(Long participantId);

    @Query("""
        SELECT COUNT(p)
        FROM Participation p
        WHERE p.participant.id = :participantId
          AND p.groupBuy.deleted = false
          AND p.groupBuy.status IN :statuses
    """)
    long countByParticipantIdAndActiveGroupBuyStatusIn(
            @Param("participantId") Long participantId,
            @Param("statuses") List<GroupBuy.Status> statuses);

    Optional<Participation> findByGroupBuyIdAndParticipantEmail(Long groupBuyId, String email);

    void deleteByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);

    // Logic B: 결제 기한 초과 미확정 참여자 조회
    List<Participation> findByGroupBuyIdAndPaymentConfirmedFalseAndPaymentDeadlineBefore(
            Long groupBuyId, LocalDateTime now);

    long countByGroupBuyIdAndPickupCompletedAtIsNotNull(Long groupBuyId);
}
