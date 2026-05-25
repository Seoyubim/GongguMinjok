package com.nbang.GongguMinjok.service;

import com.nbang.GongguMinjok.domain.Comment;
import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.User;
import com.nbang.GongguMinjok.dto.CommentResponseDto;
import com.nbang.GongguMinjok.repository.CommentRepository;
import com.nbang.GongguMinjok.repository.GroupBuyRepository;
import com.nbang.GongguMinjok.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final GroupBuyRepository groupBuyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentResponseDto> getComments(Long groupBuyId) {
        groupBuyRepository.findByIdAndDeletedFalse(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        return commentRepository.findByGroupBuyIdAndDeletedFalseOrderByCreatedAtAsc(groupBuyId)
                .stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto createComment(Long groupBuyId, String content, String email) {
        GroupBuy groupBuy = groupBuyRepository.findByIdAndDeletedFalse(groupBuyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        User writer = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }

        Comment comment = new Comment();
        comment.setGroupBuy(groupBuy);
        comment.setWriter(writer);
        comment.setContent(content.trim());

        return new CommentResponseDto(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        Comment comment = commentRepository.findByIdAndDeletedFalse(commentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!comment.getWriter().getEmail().equals(email)) {
            throw new AccessDeniedException("댓글 삭제 권한이 없습니다.");
        }

        comment.setDeleted(true);
        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }
}
