package com.synapse.api.module.note.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;

public class NoteException extends BaseException {
    public NoteException(ErrorCode errorCode) {
        super(errorCode);
    }

    public NoteException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
