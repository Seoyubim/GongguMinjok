package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Notification;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponseDto {
    private Long id;
    private String type;
    private String title;
    private String content;
    private Long relatedGroupBuyId;
    private boolean isRead;
    private LocalDateTime createdAt;

    public NotificationResponseDto(Notification notification) {
        this.id = notification.getId();
        this.type = notification.getType().name();
        this.title = notification.getTitle();
        this.content = notification.getContent();
        this.relatedGroupBuyId = notification.getRelatedGroupBuyId();
        this.isRead = notification.isRead();
        this.createdAt = notification.getCreatedAt();
    }
}
