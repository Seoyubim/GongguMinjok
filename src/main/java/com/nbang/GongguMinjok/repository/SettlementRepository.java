package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    Optional<Settlement> findByGroupBuyId(Long groupBuyId);
}
