package com.synapse.api.module.note.exception;


import com.synapse.api.util.exception.BaseException;
import com.synapse.api.util.exception.ErrorCode;

public class VersionException extends BaseException {
    public VersionException(ErrorCode errorCode) {
        super(errorCode);
    }

    public VersionException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
