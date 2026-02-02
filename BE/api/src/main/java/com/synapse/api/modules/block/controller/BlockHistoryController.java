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

    @GetMapping
    public DataResponse<Page<BlockHistoryResponse>> getBlockHistory(
            @PathVariable String noteId,
            @PathVariable String blockId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomMemberDetails details
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BlockHistoryResponse> history = blockHistoryService.getBlockHistory(
                noteId, blockId, details.id(), pageable
        );
        return DataResponse.of(history);
    }

    @GetMapping("/{version}")
    public DataResponse<BlockHistoryDetailResponse> getBlockHistoryVersion(
            @PathVariable String noteId,
            @PathVariable String blockId,
            @PathVariable int version,
            @AuthenticationPrincipal CustomMemberDetails details
    ) {
        BlockHistoryDetailResponse response = blockHistoryService.getBlockHistoryVersion(
                noteId, blockId, version, details.id()
        );
        return DataResponse.of(response);
    }

    @PostMapping("/slots/{slotNumber}")
    public DataResponse<BlockHistoryResponse> saveToSlot(
            @PathVariable String noteId,
            @PathVariable String blockId,
            @PathVariable @Min(1) @Max(5) int slotNumber,
            @AuthenticationPrincipal CustomMemberDetails details
    ) {
        BlockHistoryResponse response = blockHistoryService.saveToSlot(
                noteId, blockId, slotNumber, details.id()
        );
        return DataResponse.of(response);
    }

    @GetMapping("/slots/{slotNumber}")
    public DataResponse<BlockHistoryDetailResponse> getSlot(
            @PathVariable String noteId,
            @PathVariable String blockId,
            @PathVariable @Min(1) @Max(5) int slotNumber,
            @AuthenticationPrincipal CustomMemberDetails details
    ) {
        BlockHistoryDetailResponse response = blockHistoryService.getSlot(
                noteId, blockId, slotNumber, details.id()
        );
        return DataResponse.of(response);
    }

    @GetMapping("/slots")
    public DataResponse<List<BlockHistoryResponse>> getAllSlots(
            @PathVariable String noteId,
            @PathVariable String blockId,
            @AuthenticationPrincipal CustomMemberDetails details
    ) {
        List<BlockHistoryResponse> slots = blockHistoryService.getAllSlots(
                noteId, blockId, details.id()
        );
        return DataResponse.of(slots);
    }
}
