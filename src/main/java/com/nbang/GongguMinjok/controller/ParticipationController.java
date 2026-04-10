package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.ParticipationResponseDto;
import com.nbang.GongguMinjok.service.ParticipationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ParticipationController {

    private final ParticipationService participationService;

    @PostMapping("/groupbuys/{groupBuyId}/join")
    public ResponseEntity<ParticipationResponseDto> join(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        return ResponseEntity.ok(participationService.join(groupBuyId, email));
    }

    @DeleteMapping("/groupbuys/{groupBuyId}/cancel")
    public ResponseEntity<Void> cancel(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        participationService.cancel(groupBuyId, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groupbuys/{groupBuyId}/participants")
    public ResponseEntity<List<ParticipationResponseDto>> getParticipants(
            @PathVariable Long groupBuyId) {
        return ResponseEntity.ok(participationService.getParticipants(groupBuyId));
    }

    @GetMapping("/participations/my")
    public ResponseEntity<List<ParticipationResponseDto>> getMyParticipations(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        return ResponseEntity.ok(participationService.getMyParticipations(email));
    }
}
