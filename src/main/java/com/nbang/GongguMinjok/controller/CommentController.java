package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.CommentResponseDto;
import com.nbang.GongguMinjok.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/group-buys")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // GET /api/group-buys/{groupBuyId}/comments
    @GetMapping("/{groupBuyId}/comments")
    public ResponseEntity<List<CommentResponseDto>> getComments(@PathVariable Long groupBuyId) {
        return ResponseEntity.ok(commentService.getComments(groupBuyId));
    }

    // POST /api/group-buys/{groupBuyId}/comments
    @PostMapping("/{groupBuyId}/comments")
    public ResponseEntity<CommentResponseDto> createComment(
            @PathVariable Long groupBuyId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.createComment(
                groupBuyId, body.get("content"), userDetails.getUsername()));
    }
}
