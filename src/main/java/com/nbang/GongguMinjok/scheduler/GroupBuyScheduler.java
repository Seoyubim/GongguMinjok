package com.nbang.GongguMinjok.scheduler;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GroupBuyScheduler {

    private final GroupBuyRepository groupBuyRepository;
    private final ParticipationRepository participationRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedRate = 3600000) // 매 1시간마다 실행
    @Transactional
    public void processGroupBuyDeadlines() {
        LocalDateTime now = LocalDateTime.now();

        processExpiredGroupBuys(now);
        processUnpaidParticipants(now);
    }

    /**
     * Logic A: 모집 중 상태에서 마감일 초과 + 인원 미달 → EXPIRED 처리
     */
    private void processExpiredGroupBuys(LocalDateTime now) {
        List<GroupBuy> targets = groupBuyRepository
                .findByStatusAndDeadlineBeforeAndDeadlineNotifiedFalse(GroupBuy.Status.RECRUITING, now);

        for (GroupBuy groupBuy : targets) {
            log.info("[스케줄러-A] 공동구매 만료 처리: id={}, title={}", groupBuy.getId(), groupBuy.getTitle());

            // 참여 기록 전체 삭제 (결제 전이므로 환불 불필요)
            List<Participation> participations = participationRepository.findByGroupBuyId(groupBuy.getId());
            participationRepository.deleteAll(participations);

            groupBuy.setStatus(GroupBuy.Status.EXPIRED);
            groupBuy.setDeadlineNotified(true);
            groupBuyRepository.save(groupBuy);
        }
    }

    /**
     * Logic B: CLOSED(정원 충족) 상태에서 결제 기한 초과 미확정 참여자 처리
     */
    private void processUnpaidParticipants(LocalDateTime now) {
        List<GroupBuy> closedGroupBuys = groupBuyRepository
                .findByStatusAndPaidFalse(GroupBuy.Status.CLOSED);

        for (GroupBuy groupBuy : closedGroupBuys) {
            List<Participation> unpaidList = participationRepository
                    .findByGroupBuyIdAndPaymentConfirmedFalseAndPaymentDeadlineBefore(
                            groupBuy.getId(), now);

            if (unpaidList.isEmpty()) {
                continue;
            }

            log.info("[스케줄러-B] 결제 미확정 처리: groupBuyId={}, 미확정 참여자 수={}",
                    groupBuy.getId(), unpaidList.size());

            // 미확정 참여자 매너점수 차감 후 참여 기록 삭제
            for (Participation p : unpaidList) {
                User user = p.getParticipant();
                user.setMannerScore(user.getMannerScore() - 30);
                userRepository.save(user);
                participationRepository.delete(p);

                log.info("[스케줄러-B] 매너점수 차감: userId={}, 차감 후 점수={}", user.getId(), user.getMannerScore());
            }

            // 결제 완료자도 환불 필요 → 환불 API 미연동이므로 EXPIRED 처리
            groupBuy.setStatus(GroupBuy.Status.EXPIRED);
            groupBuy.setDeadlineNotified(true);
            groupBuyRepository.save(groupBuy);
        }
    }
}
