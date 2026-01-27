package com.synapse.api.util.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SuccessCode {
    // Success
    SUCCESS(HttpStatus.OK, "SUCCESS_001", "성공입니다"),
    CREATED(HttpStatus.CREATED, "SUCCESS_002", "리소스가 성공적으로 생성되었습니다"),
    ACCEPTED(HttpStatus.ACCEPTED, "SUCCESS_003", "요청이 성공적으로 접수되었습니다"),
    NO_CONTENT(HttpStatus.NO_CONTENT, "SUCCESS_004", "성공적으로 처리되었으며 반환할 내용이 없습니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}