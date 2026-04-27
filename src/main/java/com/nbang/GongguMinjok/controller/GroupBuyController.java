package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.DistanceRange;
import com.nbang.GongguMinjok.dto.GroupBuyRequestDto;
import com.nbang.GongguMinjok.dto.GroupBuyResponseDto;
import com.nbang.GongguMinjok.service.GroupBuyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groupbuys")
@RequiredArgsConstructor
public class GroupBuyController {

    private final GroupBuyService groupBuyService;

    // GET /api/groupbuys?userLat=37.5&userLng=127.0&distanceRange=NEAR
    @GetMapping
    public ResponseEntity<List<GroupBuyResponseDto>> getGroupBuys(
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng,
            @RequestParam(required = false) DistanceRange distanceRange) {
        return ResponseEntity.ok(groupBuyService.getGroupBuys(userLat, userLng, distanceRange));
    }

    // GET /api/groupbuys/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GroupBuyResponseDto> getGroupBuy(@PathVariable Long id) {
        return ResponseEntity.ok(groupBuyService.getGroupBuy(id));
    }

    // POST /api/groupbuys
    @PostMapping
    public ResponseEntity<GroupBuyResponseDto> createGroupBuy(
            @RequestBody GroupBuyRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(groupBuyService.createGroupBuy(dto, userDetails.getUsername()));
    }

    // PUT /api/groupbuys/{id}
    @PutMapping("/{id}")
    public ResponseEntity<GroupBuyResponseDto> updateGroupBuy(
            @PathVariable Long id,
            @RequestBody GroupBuyRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(groupBuyService.updateGroupBuy(id, dto, userDetails.getUsername()));
    }

    // DELETE /api/groupbuys/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroupBuy(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        groupBuyService.deleteGroupBuy(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // GET /api/groupbuys/host/{hostId}
    @GetMapping("/host/{hostId}")
    public ResponseEntity<List<GroupBuyResponseDto>> getGroupBuysByHost(@PathVariable Long hostId) {
        return ResponseEntity.ok(groupBuyService.getGroupBuysByHost(hostId));
    }

    // GET /api/groupbuys/my
    @GetMapping("/my")
    public ResponseEntity<List<GroupBuyResponseDto>> getMyGroupBuys(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(groupBuyService.getMyGroupBuys(userDetails.getUsername()));
    }
}