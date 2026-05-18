package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.ParticipationRequestDto;
import com.nbang.GongguMinjok.dto.ParticipationResponseDto;
import com.nbang.GongguMinjok.dto.PickupResponseDto;
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
            @RequestBody(required = false) ParticipationRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        Long pickupTimeId = (request != null) ? request.getPickupTimeId() : null;
        return ResponseEntity.ok(participationService.join(groupBuyId, email, pickupTimeId));
    }

    @DeleteMapping("/groupbuys/{groupBuyId}/cancel")
    public ResponseEntity<Void> cancel(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        participationService.cancel(groupBuyId, email);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/groupbuys/{groupBuyId}/pickup-time")
    public ResponseEntity<ParticipationResponseDto> updatePickupTime(
            @PathVariable Long groupBuyId,
            @RequestBody ParticipationRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        return ResponseEntity.ok(participationService.updatePickupTime(
                groupBuyId,
                email,
                request.getPickupTimeId()));
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

    @PostMapping("/groupbuys/{groupBuyId}/pickup/complete")
    public ResponseEntity<PickupResponseDto> completePickup(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(participationService.completePickup(groupBuyId, userDetails.getUsername()));
    }
}
