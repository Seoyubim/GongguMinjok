package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.admin.AdminBlockRequestDto;
import com.nbang.GongguMinjok.dto.admin.AdminGroupBuyDetailDto;
import com.nbang.GongguMinjok.dto.admin.AdminGroupBuyDto;
import com.nbang.GongguMinjok.dto.admin.AdminRefundDto;
import com.nbang.GongguMinjok.dto.admin.AdminSettlementDetailDto;
import com.nbang.GongguMinjok.dto.admin.AdminSettlementDto;
import com.nbang.GongguMinjok.dto.admin.AdminStatsDto;
import com.nbang.GongguMinjok.dto.admin.AdminUserDto;
import com.nbang.GongguMinjok.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserDto>> getUsers(@RequestParam(required = false) String filter) {
        return ResponseEntity.ok(adminService.getUsers(filter));
    }

    @GetMapping("/users/{userId}/detail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId));
    }

    @PatchMapping("/users/{userId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> setUserBlock(
            @PathVariable Long userId,
            @RequestBody AdminBlockRequestDto body) {
        adminService.setUserBlock(userId, body.isBlock());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/groupbuys")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminGroupBuyDto>> getGroupBuys(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getGroupBuys(status));
    }

    @GetMapping("/groupbuys/{groupBuyId}/detail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminGroupBuyDetailDto> getGroupBuyDetail(@PathVariable Long groupBuyId) {
        return ResponseEntity.ok(adminService.getGroupBuyDetail(groupBuyId));
    }

    @DeleteMapping("/groupbuys/{groupBuyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGroupBuy(@PathVariable Long groupBuyId) {
        adminService.deleteGroupBuy(groupBuyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/settlements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminSettlementDto>> getSettlements(
            @RequestParam(required = false) String filter) {
        return ResponseEntity.ok(adminService.getSettlements(filter));
    }

    @GetMapping("/settlements/{groupBuyId}/detail")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminSettlementDetailDto> getSettlementDetail(@PathVariable Long groupBuyId) {
        return ResponseEntity.ok(adminService.getSettlementDetail(groupBuyId));
    }

    @PostMapping("/settlements/{groupBuyId}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> completeSettlement(@PathVariable Long groupBuyId) {
        adminService.completeSettlement(groupBuyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/refunds")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminRefundDto>> getRefunds() {
        return ResponseEntity.ok(adminService.getRefunds());
    }

    @PostMapping("/refunds/{groupBuyId}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> processRefund(@PathVariable Long groupBuyId) {
        adminService.processRefund(groupBuyId);
        return ResponseEntity.ok().build();
    }
}
