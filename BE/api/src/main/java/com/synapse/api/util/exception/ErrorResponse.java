package com.synapse.api.util.exception;

import lombok.Builder;
import lombok.Getter;
import org.springframework.validation.FieldError;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class ErrorResponse {
    private final int code;
    private final String message;
    private final LocalDateTime timestamp;
    private final List<FieldErrorDetail> errors;

    public static ErrorResponse of(ErrorCode errorCode) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .errors(new ArrayList<>())
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(message)
                .timestamp(LocalDateTime.now())
                .errors(new ArrayList<>())
                .build();
    }

    public static ErrorResponse of(ErrorCode errorCode, List<FieldError> fieldErrors) {
        List<FieldErrorDetail> errors = fieldErrors.stream()
                .map(error -> FieldErrorDetail.builder()
                        .field(error.getField())
                        .value(error.getRejectedValue() != null ? error.getRejectedValue().toString() : null)
                        .reason(error.getDefaultMessage())
                        .build())
                .toList();

        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .timestamp(LocalDateTime.now())
                .errors(errors)
                .build();
    }

    @Getter
    @Builder
    public static class FieldErrorDetail {
        private final String field;
        private final String value;
        private final String reason;
    }
}
