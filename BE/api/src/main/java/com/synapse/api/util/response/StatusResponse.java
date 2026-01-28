package com.synapse.api.util.response;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Getter;

import java.util.Collections;
import java.util.Map;

@Getter
@JsonPropertyOrder({"success", "code", "message", "path", "data"})
public class StatusResponse extends ResponseDTO {

    private final Map<String, Object> data;

    private StatusResponse(SuccessCode code) {
        super(true, code.name(), code.getMessage(), null);
        this.data = Collections.emptyMap();
    }

    public static StatusResponse of() {
        return new StatusResponse(SuccessCode.SUCCESS);
    }

    public static StatusResponse of(SuccessCode code) {
        return new StatusResponse(code);
    }
}
