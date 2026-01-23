package com.synapse.api.module.note.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;

public class VersionException extends BaseException {
    public VersionException(ErrorCode errorCode) {
        super(errorCode);
    }

    public VersionException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
