package com.synapse.api.modules.image.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UploadUrlRequest(
        @NotBlank(message = "originalFileName is required")
        String originalFileName,

        @NotBlank(message = "contentType is required")
        String contentType
) {}
