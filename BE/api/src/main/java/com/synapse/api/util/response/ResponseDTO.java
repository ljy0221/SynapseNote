package com.synapse.api.util.response;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonPropertyOrder({"success", "code", "message", "path"})
public class ResponseDTO {

    private boolean success;
    private String code;
    private String message ;
    private String path;

    protected ResponseDTO() {}

    protected ResponseDTO(boolean success, String code, String message, String path) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.path = path;
    }
}
