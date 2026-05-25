package com.nbang.GongguMinjok.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.nbang.GongguMinjok.domain.FcmToken;
import com.nbang.GongguMinjok.domain.Notification;
import com.nbang.GongguMinjok.domain.Notification.NotificationType;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.NotificationResponseDto;
import com.nbang.GongguMinjok.repository.FcmTokenRepository;
import com.nbang.GongguMinjok.repository.NotificationRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional
    public void sendNotification(Long receiverId, NotificationType type,
                                 String title, String content, Long relatedGroupBuyId) {
        // 1. DB 저장
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("User not found: " + receiverId));
        Notification notification = new Notification();
        notification.setReceiver(receiver);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedGroupBuyId(relatedGroupBuyId);
        notificationRepository.save(notification);

        // 2. FCM 발송
        List<FcmToken> tokens = fcmTokenRepository.findByUserIdAndActiveTrue(receiverId);
        if (tokens.isEmpty()) return;

        for (FcmToken fcmToken : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(fcmToken.getToken())
                        .setNotification(
                                com.google.firebase.messaging.Notification.builder()
                                        .setTitle(title)
                                        .setBody(content)
                                        .build()
                        )
                        .putData("type", type.name())
                        .putData("relatedGroupBuyId",
                                relatedGroupBuyId != null ? relatedGroupBuyId.toString() : "")
                        .build();
                FirebaseMessaging.getInstance().send(message);
            } catch (FirebaseMessagingException e) {
                log.warn("FCM 발송 실패 - userId: {}, token: {}, error: {}",
                        receiverId, fcmToken.getToken(), e.getMessage());
                if ("UNREGISTERED".equals(e.getMessagingErrorCode().name())) {
                    fcmToken.setActive(false);
                    fcmTokenRepository.save(fcmToken);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDto> getNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, String email) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!notification.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("권한 없음");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> unread = notificationRepository
                .findByReceiverIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
