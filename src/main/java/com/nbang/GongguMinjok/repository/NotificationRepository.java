package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
