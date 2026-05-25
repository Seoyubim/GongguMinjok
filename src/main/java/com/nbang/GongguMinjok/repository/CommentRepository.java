package com.nbang.GongguMinjok.repository;

import com.nbang.GongguMinjok.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByGroupBuyIdAndDeletedFalseOrderByCreatedAtAsc(Long groupBuyId);
    Optional<Comment> findByIdAndDeletedFalse(Long id);
}
