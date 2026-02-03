package com.synapse.api.modules.block.controller;

import com.synapse.api.modules.block.service.BlockDummyService;
import com.synapse.api.util.response.DataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BlockDummyController {

    private final BlockDummyService blockDummyService;

    @PostMapping("/api/v1/test/block-dummy")
    public DataResponse<UUID> addBlockDummy() {
        UUID noteId = blockDummyService.initBinarySearchDocument();
        return DataResponse.of(noteId);
    }

}
