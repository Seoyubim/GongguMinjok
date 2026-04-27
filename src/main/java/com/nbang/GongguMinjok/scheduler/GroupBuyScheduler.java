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

        processClosingGroupBuys(now);
        processExpiredGroupBuys(now);
        processUnpaidParticipants(now);
    }

    /**
     * Logic C: 마감일 24시간 전 → CLOSING 처리
     */
    private void processClosingGroupBuys(LocalDateTime now) {
        List<GroupBuy> targets = groupBuyRepository
                .findByStatusAndDeadlineAfterAndDeadlineBefore(
                        GroupBuy.Status.OPEN, now, now.plusHours(24));

        for (GroupBuy groupBuy : targets) {
            log.info("[스케줄러-C] 마감 임박 처리: id={}, title={}", groupBuy.getId(), groupBuy.getTitle());

            groupBuy.setStatus(GroupBuy.Status.CLOSING);
            groupBuyRepository.save(groupBuy);
        }
    }

    /**
     * Logic A: 모집 중 상태에서 마감일 초과 + 인원 미달 → EXPIRED 처리
     */
    private void processExpiredGroupBuys(LocalDateTime now) {
        List<GroupBuy> targets = groupBuyRepository
                .findByStatusInAndDeadlineBeforeAndDeadlineNotifiedFalse(
                        List.of(GroupBuy.Status.OPEN, GroupBuy.Status.CLOSING), now);

        for (GroupBuy groupBuy : targets) {
            log.info("[스케줄러-A] 공동구매 만료 처리: id={}, title={}", groupBuy.getId(), groupBuy.getTitle());

            groupBuy.setStatus(GroupBuy.Status.EXPIRED);
            groupBuy.setDeadlineNotified(true);
            groupBuyRepository.save(groupBuy);
        }
    }

    /**
     * Logic B: CLOSED(정원 충족) 상태에서 결제 기한 초과 미확정 참여자 처리 또는 전원 결제 완료 시 PAYMENT_COMPLETED 전환
     */
    private void processUnpaidParticipants(LocalDateTime now) {
        List<GroupBuy> closedGroupBuys = groupBuyRepository.findByStatus(GroupBuy.Status.CLOSED);

        for (GroupBuy groupBuy : closedGroupBuys) {
            List<Participation> unpaidList = participationRepository
                    .findByGroupBuyIdAndPaymentConfirmedFalseAndPaymentDeadlineBefore(
                            groupBuy.getId(), now);

            if (!unpaidList.isEmpty()) {
                log.info("[스케줄러-B] 결제 미확정 처리: groupBuyId={}, 미확정 참여자 수={}",
                        groupBuy.getId(), unpaidList.size());

                for (Participation p : unpaidList) {
                    User user = p.getParticipant();
                    user.setMannerScore(user.getMannerScore() - 30);
                    userRepository.save(user);
                    log.info("[스케줄러-B] 매너점수 차감: userId={}, 차감 후 점수={}", user.getId(), user.getMannerScore());
                }

                // 결제 완료자도 환불 필요 → 환불 API 미연동이므로 EXPIRED 처리
                groupBuy.setStatus(GroupBuy.Status.EXPIRED);
                groupBuy.setDeadlineNotified(true);
                groupBuyRepository.save(groupBuy);
            } else {
                // 기한 초과 미결제자 없음 → 전원 결제 완료 여부 확인
                boolean allPaid = participationRepository.findByGroupBuyId(groupBuy.getId())
                        .stream().allMatch(Participation::isPaymentConfirmed);
                if (allPaid) {
                    log.info("[스케줄러-B] 전원 결제 완료: groupBuyId={}", groupBuy.getId());
                    groupBuy.setStatus(GroupBuy.Status.PAYMENT_COMPLETED);
                    groupBuyRepository.save(groupBuy);
                }
            }
        }
    }
}
