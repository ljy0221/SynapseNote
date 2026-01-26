package com.synapse.api.util.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum SuccessCode {
    // Success (2xxx)
    SUCCESS(HttpStatus.OK, 2000, "성공입니다"),
    CREATED(HttpStatus.CREATED, 2001, "리소스가 성공적으로 생성되었습니다"),
    ACCEPTED(HttpStatus.ACCEPTED, 2002, "요청이 성공적으로 접수되었습니다"),
    NO_CONTENT(HttpStatus.NO_CONTENT, 2004, "성공적으로 처리되었으며 반환할 내용이 없습니다");

    private final HttpStatus httpStatus;
    private final int code;
    private final String message;
}