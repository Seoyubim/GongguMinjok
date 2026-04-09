package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.GroupBuy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupBuyRepository extends JpaRepository<GroupBuy, Long> {
    List<GroupBuy> findAllByOrderByCreatedAtDesc();
    List<GroupBuy> findByHostId(Long hostId);
    List<GroupBuy> findByCategory(GroupBuy.Category category);
    List<GroupBuy> findByStatus(GroupBuy.Status status);
}