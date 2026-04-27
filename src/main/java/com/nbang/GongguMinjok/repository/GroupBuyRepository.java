package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.GroupBuy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface GroupBuyRepository extends JpaRepository<GroupBuy, Long> {
    List<GroupBuy> findAllByOrderByCreatedAtDesc();
    List<GroupBuy> findByHostId(Long hostId);
    List<GroupBuy> findByCategory(GroupBuy.Category category);
    List<GroupBuy> findByStatus(GroupBuy.Status status);

    // Logic A: 인원 미달 만료 처리 대상 (OPEN, CLOSING 모두 포함)
    List<GroupBuy> findByStatusInAndDeadlineBeforeAndDeadlineNotifiedFalse(
            List<GroupBuy.Status> statuses, LocalDateTime now);

    // Logic C: 마감 24시간 전 CLOSING 전환 대상 (deadline이 now~now+24h 사이)
    List<GroupBuy> findByStatusAndDeadlineAfterAndDeadlineBefore(
            GroupBuy.Status status, LocalDateTime from, LocalDateTime to);
}