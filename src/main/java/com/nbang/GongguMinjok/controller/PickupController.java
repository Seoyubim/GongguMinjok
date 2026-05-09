package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.PickupResponseDto;
import com.nbang.GongguMinjok.service.PickupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PickupController {

    private final PickupService pickupService;

    @PostMapping("/groupbuys/{groupBuyId}/pickup/complete")
    public ResponseEntity<PickupResponseDto> completePickup(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                pickupService.completePickup(groupBuyId, userDetails.getUsername()));
    }
}
