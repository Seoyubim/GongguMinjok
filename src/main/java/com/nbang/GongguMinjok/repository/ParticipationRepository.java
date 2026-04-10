package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Participation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    boolean existsByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);

    List<Participation> findByGroupBuyId(Long groupBuyId);

    List<Participation> findByParticipantId(Long participantId);

    void deleteByGroupBuyIdAndParticipantId(Long groupBuyId, Long participantId);
}
