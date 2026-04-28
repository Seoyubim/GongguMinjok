package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.ParticipationResponseDto;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;

    @Transactional
    public ParticipationResponseDto join(Long groupBuyId, String email) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        if (groupBuy.getStatus() != GroupBuy.Status.OPEN
                && groupBuy.getStatus() != GroupBuy.Status.CLOSING) {
            throw new IllegalArgumentException("참여할 수 없는 공동구매입니다.");
        }

        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (groupBuy.getHost().getId().equals(participant.getId())) {
            throw new IllegalArgumentException("호스트는 참여할 수 없습니다.");
        }

        if (participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, participant.getId())) {
            throw new IllegalArgumentException("이미 참여한 공동구매입니다.");
        }

        if (groupBuy.getCurrentParticipants() >= groupBuy.getMaxParticipants()) {
            throw new IllegalArgumentException("정원이 초과되었습니다.");
        }

        Participation participation = new Participation();
        participation.setGroupBuy(groupBuy);
        participation.setParticipant(participant);
        participationRepository.save(participation);

        groupBuy.setCurrentParticipants(groupBuy.getCurrentParticipants() + 1);

        if (groupBuy.getCurrentParticipants() == groupBuy.getMaxParticipants()) {
            groupBuy.setStatus(GroupBuy.Status.CLOSED);

            // 정원 충족 시점에 금액 확정
            int participantAmount = groupBuy.getParticipantFinalPrice();
            int hostAmount = groupBuy.getHostFinalPrice();
            groupBuy.setHostPaymentAmount(hostAmount);

            // 결제 기한: 정원 충족 시각 + 24시간
            LocalDateTime paymentDeadline = LocalDateTime.now().plusHours(24);
            List<Participation> participations = participationRepository.findByGroupBuyId(groupBuyId);
            participations.forEach(p -> {
                p.setPaymentDeadline(paymentDeadline);
                p.setPaymentAmount(participantAmount);
            });
            participationRepository.saveAll(participations);
        }

        groupBuyRepository.save(groupBuy);

        return ParticipationResponseDto.from(participation);
    }

    @Transactional
    public void cancel(Long groupBuyId, String email) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));

        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!participationRepository.existsByGroupBuyIdAndParticipantId(groupBuyId, participant.getId())) {
            throw new IllegalArgumentException("참여하지 않은 공동구매입니다.");
        }

        GroupBuy.Status currentStatus = groupBuy.getStatus();
        if (currentStatus != GroupBuy.Status.OPEN
                && currentStatus != GroupBuy.Status.CLOSING) {
            throw new IllegalArgumentException("모집 중인 공동구매만 취소할 수 있습니다.");
        }

        participationRepository.deleteByGroupBuyIdAndParticipantId(groupBuyId, participant.getId());

        groupBuy.setCurrentParticipants(groupBuy.getCurrentParticipants() - 1);
        groupBuy.setStatus(currentStatus);
        groupBuyRepository.save(groupBuy);
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponseDto> getParticipants(Long groupBuyId) {
        return participationRepository.findByGroupBuyId(groupBuyId).stream()
                .map(ParticipationResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponseDto> getMyParticipations(String email) {
        User participant = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        return participationRepository.findByParticipantId(participant.getId()).stream()
                .map(ParticipationResponseDto::from)
                .collect(Collectors.toList());
    }

}
