package com.synapse.api.util.response;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Getter;

@Getter
@JsonPropertyOrder({"success", "code", "message", "path", "data"})
public class DataResponse<T> extends ResponseDTO {

    private final T data;

    private DataResponse(SuccessCode code, T data) {
        this(code, data, null);
    }

    private DataResponse(T data) {
        this(SuccessCode.SUCCESS, data, null);
    }

    public DataResponse(SuccessCode code, T data, String path) {
        super(true, code.name(), code.getMessage(), path);
        this.data = data;
    }

    public static <T> DataResponse<T> of(T data) {
        return new DataResponse<>(data);
    }
    public static <T> DataResponse<T> of(SuccessCode code, T data) {
        return new DataResponse<>(code, data);
    }

}
