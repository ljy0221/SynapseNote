package com.synapse.api.module.common.exception;

import java.util.HashMap;
import java.util.Map;

public class BaseException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Map<String, Object> details;

    public BaseException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }

    public BaseException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
        this.details = new HashMap<>();
    }

    public BaseException(ErrorCode errorCode, Map<String, Object> details) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = details;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public BaseException addDetail(String key, Object value) {
        this.details.put(key, value);
        return this;
    }
}