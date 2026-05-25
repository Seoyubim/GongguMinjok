package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Comment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponseDto {
    private final Long commentId;
    private final Long writerId;
    private final String writerNickname;
    private final String writerProfileImage;
    private final String content;
    private final LocalDateTime createdAt;
    private final boolean isHost;

    public CommentResponseDto(Comment comment) {
        this.commentId = comment.getId();
        this.writerId = comment.getWriter().getId();
        this.writerNickname = comment.getWriter().getNickname();
        this.writerProfileImage = comment.getWriter().getProfileImage();
        this.content = comment.getContent();
        this.createdAt = comment.getCreatedAt();
        this.isHost = comment.getWriter().getId()
                .equals(comment.getGroupBuy().getHost().getId());
    }
}
