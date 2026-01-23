package com.synapse.api.module.auth.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;

public class AuthException extends BaseException {
    public AuthException(ErrorCode errorCode) {
        super(errorCode);
    }

    public AuthException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
