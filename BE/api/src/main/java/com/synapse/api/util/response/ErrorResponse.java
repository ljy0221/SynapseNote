package com.synapse.api.util.response;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@JsonPropertyOrder({"success", "error"})
public class ErrorResponse {

    private final boolean success = false;
    private final Error error;

    private ErrorResponse(ErrorCode code) {
        this(code, null);
    }

    private ErrorResponse(ErrorCode code, String path) {
        this.error = Error.builder()
                .code(code.name())
                .message(code.getMessage())
                .timestamp(LocalDateTime.now())
                .path(path)
                .build();
    }

    public static ErrorResponse of(ErrorCode code) { return new ErrorResponse(code); }
    public static ErrorResponse of(ErrorCode code, String path) { return new ErrorResponse(code, path); }

    @Builder
    @AllArgsConstructor
    @Getter
    public static class Error {

        private String code;
        private String message;
        private LocalDateTime timestamp;
        @Setter private String path;

    }

}
