package com.synapse.api.module.common.exception;

public class ValidationException extends BaseException {
    public ValidationException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ValidationException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
