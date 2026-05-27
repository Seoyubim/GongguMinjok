package com.nbang.GongguMinjok.controller;

import com.nbang.GongguMinjok.dto.GroupBuyResponseDto;
import com.nbang.GongguMinjok.service.GroupBuyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/groupbuys")
@RequiredArgsConstructor
public class AdminGroupBuyController {

    private final GroupBuyService groupBuyService;

    // POST /api/admin/groupbuys/{id}/complete
    // PENDING → COMPLETED (관리자 정산 완료)
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupBuyResponseDto> completeSettlement(@PathVariable Long id) {
        return ResponseEntity.ok(groupBuyService.completeSettlement(id));
    }
}
