package com.synapse.api.module.common.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class ErrorResponse {
    private final boolean success = false;
    private final ErrorDetail error;

    @Getter
    @Builder
    public static class ErrorDetail {
        private String code;
        private String message;
        private LocalDateTime timestamp;
        private String path;
        private Map<String, Object> details;
    }

    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return ErrorResponse.builder()
                .error(ErrorDetail.builder()
                        .code(errorCode.name())
                        .message(errorCode.getMessage())
                        .timestamp(LocalDateTime.now())
                        .path(path)
                        .build())
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String path, Map<String, Object> details) {
        return ErrorResponse.builder()
                .error(ErrorDetail.builder()
                        .code(errorCode.name())
                        .message(errorCode.getMessage())
                        .timestamp(LocalDateTime.now())
                        .path(path)
                        .details(details)
                        .build())
                .build();
    }

    public static ErrorResponse of(BaseException e, String path) {
        return ErrorResponse.builder()
                .error(ErrorDetail.builder()
                        .code(e.getErrorCode().name())
                        .message(e.getMessage())
                        .timestamp(LocalDateTime.now())
                        .path(path)
                        .details(e.getDetails().isEmpty() ? null : e.getDetails())
                        .build())
                .build();
    }
}
