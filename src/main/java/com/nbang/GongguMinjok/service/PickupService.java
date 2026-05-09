package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.Settlement;
import com.nbang.GongguMinjok.dto.PickupResponseDto;
import com.nbang.GongguMinjok.dto.SettlementResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PickupService {

    private final ParticipationRepository participationRepository;
    private final SettlementRepository settlementRepository;
    private final GroupBuyRepository groupBuyRepository;

    @Transactional
    public PickupResponseDto completePickup(Long groupBuyId, String email) {
        Participation participation = participationRepository
                .findByGroupBuyIdAndParticipantEmail(groupBuyId, email)
                .orElseThrow(() -> new IllegalArgumentException("참여 내역을 찾을 수 없습니다."));

        GroupBuy groupBuy = participation.getGroupBuy();
        if (groupBuy.getStatus() != GroupBuy.Status.PICKUP_READY) {
            throw new IllegalStateException("픽업 가능 상태가 아닙니다.");
        }

        if (participation.getPickupCompletedAt() != null) {
            throw new IllegalStateException("이미 픽업 완료 처리되었습니다.");
        }

        participation.setPickupCompletedAt(LocalDateTime.now());
        participationRepository.save(participation);

        List<Participation> allParticipations = participationRepository.findByGroupBuyId(groupBuyId);
        boolean allCompleted = allParticipations.stream()
                .allMatch(p -> p.getPickupCompletedAt() != null);

        SettlementResponseDto settlementDto = null;
        if (allCompleted) {
            Settlement settlement = settlementRepository.findByGroupBuyId(groupBuyId)
                    .orElseThrow(() -> new IllegalStateException("정산 정보를 찾을 수 없습니다."));
            settlement.setStatus(Settlement.Status.COMPLETED);
            settlement.setSettledAt(LocalDateTime.now());
            settlementRepository.save(settlement);

            groupBuy.setStatus(GroupBuy.Status.COMPLETED);
            groupBuy.setCompletedAt(LocalDateTime.now());
            groupBuyRepository.save(groupBuy);

            settlementDto = new SettlementResponseDto(settlement);
        }

        return new PickupResponseDto(participation.getId(), participation.getPickupCompletedAt(),
                allCompleted, settlementDto);
    }
}
