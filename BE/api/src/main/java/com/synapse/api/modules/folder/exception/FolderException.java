package com.synapse.api.modules.folder.exception;


import com.synapse.api.util.exception.BaseException;
import com.synapse.api.util.response.ErrorCode;

public class FolderException extends BaseException {
    public FolderException(ErrorCode errorCode) {
        super(errorCode);
    }

    public FolderException(ErrorCode errorCode, String customMessage) {
        super(errorCode);
    }
}
