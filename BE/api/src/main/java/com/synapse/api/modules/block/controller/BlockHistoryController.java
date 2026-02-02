package com.synapse.api.modules.block.controller;

import com.synapse.api.modules.block.dto.response.BlockHistoryDetailResponse;
import com.synapse.api.modules.block.dto.response.BlockHistoryResponse;
import com.synapse.api.modules.block.service.BlockHistoryService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes/{noteId}/blocks/{blockId}/history")
@RequiredArgsConstructor
@Validated
public class BlockHistoryController {

        private final BlockHistoryService blockHistoryService;

        /**
         * 블록 히스토리 목록 조회
         * 
         * @apiNote CodeBlock 전용 기능. TextBlock 호출 시 400 에러 (BLOCK_010) 반환
         */
        @GetMapping
        public DataResponse<Page<BlockHistoryResponse>> getBlockHistory(
                        @PathVariable String noteId,
                        @PathVariable String blockId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @AuthenticationPrincipal CustomMemberDetails details) {
                Pageable pageable = PageRequest.of(page, size);
                Page<BlockHistoryResponse> history = blockHistoryService.getBlockHistory(
                                noteId, blockId, details.id(), pageable);
                return DataResponse.of(history);
        }

        /**
         * 슬롯에 현재 블록 상태 저장
         * 
         * @apiNote CodeBlock 전용 기능. TextBlock 호출 시 400 에러 (BLOCK_010) 반환
         */
        @PostMapping("/slots/{slotNumber}")
        public DataResponse<BlockHistoryResponse> saveToSlot(
                        @PathVariable String noteId,
                        @PathVariable String blockId,
                        @PathVariable @Min(1) @Max(5) int slotNumber,
                        @AuthenticationPrincipal CustomMemberDetails details) {
                BlockHistoryResponse response = blockHistoryService.saveToSlot(
                                noteId, blockId, slotNumber, details.id());
                return DataResponse.of(response);
        }

        /**
         * 특정 슬롯 조회
         * 
         * @apiNote CodeBlock 전용 기능. TextBlock 호출 시 400 에러 (BLOCK_010) 반환
         */
        @GetMapping("/slots/{slotNumber}")
        public DataResponse<BlockHistoryDetailResponse> getSlot(
                        @PathVariable String noteId,
                        @PathVariable String blockId,
                        @PathVariable @Min(1) @Max(5) int slotNumber,
                        @AuthenticationPrincipal CustomMemberDetails details) {
                BlockHistoryDetailResponse response = blockHistoryService.getSlot(
                                noteId, blockId, slotNumber, details.id());
                return DataResponse.of(response);
        }

        /**
         * 모든 슬롯 조회
         * 
         * @apiNote CodeBlock 전용 기능. TextBlock 호출 시 400 에러 (BLOCK_010) 반환
         */
        @GetMapping("/slots")
        public DataResponse<List<BlockHistoryResponse>> getAllSlots(
                        @PathVariable String noteId,
                        @PathVariable String blockId,
                        @AuthenticationPrincipal CustomMemberDetails details) {
                List<BlockHistoryResponse> slots = blockHistoryService.getAllSlots(
                                noteId, blockId, details.id());
                return DataResponse.of(slots);
        }
}
