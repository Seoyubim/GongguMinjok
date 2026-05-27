package com.nbang.GongguMinjok.scheduler;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.Payment;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.ParticipationRepository;
import com.nbang.GongguMinjok.repository.PaymentRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import com.nbang.GongguMinjok.service.PaymentService;
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
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    @Scheduled(fixedRate = 3600000) // 매 1시간마다 실행
    @Transactional
    public void processGroupBuyDeadlines() {
        LocalDateTime now = LocalDateTime.now();

        processClosingGroupBuys(now);
        processExpiredGroupBuys(now);
        processUnpaidParticipants(now);
        processIncompletePickups(now);
    }

    /**
     * Logic C: 마감일 24시간 전 → CLOSING 처리
     */
    private void processClosingGroupBuys(LocalDateTime now) {
        List<GroupBuy> targets = groupBuyRepository
                .findByStatusAndDeadlineAfterAndDeadlineBeforeAndDeletedFalse(
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
                .findByStatusInAndDeadlineBeforeAndDeadlineNotifiedFalseAndDeletedFalse(
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
        List<GroupBuy> closedGroupBuys = groupBuyRepository.findByStatusAndDeletedFalse(GroupBuy.Status.CLOSED);

        for (GroupBuy groupBuy : closedGroupBuys) {
            List<Participation> unpaidList = participationRepository
                    .findByGroupBuyIdAndPaymentConfirmedFalseAndPaymentDeadlineBefore(
                            groupBuy.getId(), now);

            if (!unpaidList.isEmpty()) {
                log.info("[스케줄러-B] 결제 미확정 처리: groupBuyId={}, 미확정 참여자 수={}",
                        groupBuy.getId(), unpaidList.size());

                for (Participation p : unpaidList) {
                    expireReadyPayments(p);

                    User user = p.getParticipant();
                    user.updateMannerScore(-10);
                    userRepository.save(user);
                    log.info("[스케줄러-B] 매너점수 차감: userId={}, 차감 후 점수={}", user.getId(), user.getMannerScore());
                }

                // 결제 완료자 환불
                paymentService.refundApprovedPayments(groupBuy.getId(), "미결제 참여자 발생으로 인한 공동구매 취소");
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

    /**
     * Logic D: PICKUP_READY 상태에서 픽업 시간 + 24시간 경과 후 전원 픽업 미완료 시 호스트 귀책 처리
     */
    private void processIncompletePickups(LocalDateTime now) {
        List<GroupBuy> pickupReadyGroupBuys = groupBuyRepository.findByStatusAndDeletedFalse(GroupBuy.Status.PICKUP_READY);

        for (GroupBuy groupBuy : pickupReadyGroupBuys) {
            List<Participation> participations = participationRepository.findByGroupBuyIdWithPickupTime(groupBuy.getId());
            if (participations.isEmpty()) {
                continue;
            }

            LocalDateTime latestPickupTime = participations.stream()
                    .filter(p -> p.getPickupTime() != null)
                    .map(p -> p.getPickupTime().getPickupTime())
                    .max(LocalDateTime::compareTo)
                    .orElse(null);

            if (latestPickupTime == null || now.isBefore(latestPickupTime.plusHours(24))) {
                continue;
            }

            boolean allPickupCompleted = participations.stream()
                    .allMatch(p -> p.getPickupCompletedAt() != null);
            if (allPickupCompleted) {
                groupBuy.setStatus(GroupBuy.Status.PENDING);
                groupBuyRepository.save(groupBuy);
                continue;
            }

            User host = groupBuy.getHost();
            host.updateMannerScore(-30);
            userRepository.save(host);

            // 결제 완료 참여자 전원 환불
            paymentService.refundApprovedPayments(groupBuy.getId(), "픽업 미완료로 인한 공동구매 취소");
            groupBuy.setStatus(GroupBuy.Status.EXPIRED);
            groupBuy.setDeadlineNotified(true);
            groupBuyRepository.save(groupBuy);

            log.info("[스케줄러-D] 픽업 미완료 호스트 매너점수 차감: groupBuyId={}, hostId={}, 차감 후 점수={}",
                    groupBuy.getId(), host.getId(), host.getMannerScore());
        }
    }

    private void expireReadyPayments(Participation participation) {
        List<Payment> readyPayments = paymentRepository
                .findByParticipationIdAndStatus(participation.getId(), Payment.Status.READY);

        for (Payment payment : readyPayments) {
            payment.setStatus(Payment.Status.EXPIRED);
            payment.setFailReason("Payment deadline expired.");
        }

        paymentRepository.saveAll(readyPayments);
    }
}
