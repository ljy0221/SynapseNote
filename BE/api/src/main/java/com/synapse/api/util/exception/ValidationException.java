package com.synapse.api.util.exception;


import com.synapse.api.util.response.ErrorCode;

public class ValidationException extends BaseException {
    public ValidationException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ValidationException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
