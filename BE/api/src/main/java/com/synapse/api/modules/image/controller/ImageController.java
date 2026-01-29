package com.synapse.api.modules.image.controller;

import com.synapse.api.modules.image.dto.request.UploadUrlRequest;
import com.synapse.api.modules.image.dto.response.ReadUrlResponse;
import com.synapse.api.modules.image.dto.response.UploadUrlResponse;
import com.synapse.api.modules.image.service.ImageService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/v1/images/upload-url")
    public DataResponse<UploadUrlResponse> createUploadUrl(@Valid @RequestBody UploadUrlRequest request) {
        UploadUrlResponse response = imageService.createPresignedUploadUrl(request);
        return DataResponse.of(response);
    }

    @GetMapping("/v1/images/read-url")
    public DataResponse<ReadUrlResponse> createReadUrl(@RequestParam String key) {
        ReadUrlResponse response = imageService.createPresignedReadUrl(key);
        return DataResponse.of(response);
    }

    @DeleteMapping("/v1/images")
        public StatusResponse delete(@RequestParam String key) {
            imageService.deleteImage(key);
            return StatusResponse.of();
    }

}
