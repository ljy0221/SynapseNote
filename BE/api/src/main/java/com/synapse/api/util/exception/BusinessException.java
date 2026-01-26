package com.synapse.api.util.exception;

import java.util.Map;

public class BusinessException extends BaseException {

    public BusinessException(ErrorCode errorCode) {
        super(errorCode);
    }

    public BusinessException(ErrorCode errorCode, String customMessage) {
        super(errorCode, customMessage);
    }

    public BusinessException(ErrorCode errorCode, Map<String, Object> details) {
        super(errorCode, details);
    }
}
