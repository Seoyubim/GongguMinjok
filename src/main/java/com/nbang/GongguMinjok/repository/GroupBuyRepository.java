package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.GroupBuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GroupBuyRepository extends JpaRepository<GroupBuy, Long> {
    List<GroupBuy> findAllByDeletedFalseOrderByCreatedAtDesc();
    @Query("""
            SELECT gb
            FROM GroupBuy gb
            WHERE gb.deleted = false
              AND (
                    LOWER(gb.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(COALESCE(gb.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  )
            ORDER BY gb.createdAt DESC
            """)
    List<GroupBuy> searchByKeyword(@Param("keyword") String keyword);

    Optional<GroupBuy> findByIdAndDeletedFalse(Long id);
    List<GroupBuy> findByHostIdAndDeletedFalse(Long hostId);
    List<GroupBuy> findByCategoryAndDeletedFalse(GroupBuy.Category category);
    List<GroupBuy> findByStatusAndDeletedFalse(GroupBuy.Status status);

    long countByHostIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long hostId, LocalDateTime start, LocalDateTime end);

    List<GroupBuy> findByStatusInAndDeadlineBeforeAndDeadlineNotifiedFalseAndDeletedFalse(
            List<GroupBuy.Status> statuses, LocalDateTime now);

    List<GroupBuy> findByStatusAndDeadlineAfterAndDeadlineBeforeAndDeletedFalse(
            GroupBuy.Status status, LocalDateTime from, LocalDateTime to);
}
