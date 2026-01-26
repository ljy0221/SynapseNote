package com.synapse.api.util.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common (1xxx)
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, 1000, "잘못된 입력 값입니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, 1001, "지원하지 않는 HTTP 메서드입니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 1002, "서버 내부 오류가 발생했습니다"),
    INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, 1003, "잘못된 타입입니다"),

    // Auth (5xxx)
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, 5001, "인증되지 않은 사용자입니다"),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, 5002, "접근 권한이 없습니다"),

    // User (8xxx)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, 8000, "사용자를 찾을 수 없습니다"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, 8001, "이미 존재하는 사용자입니다"),
    VALIDATION_INVALID_PARAMETER(HttpStatus.BAD_REQUEST, 8002, "잘못된 요청 파라미터입니다"),

    // Note (3xxx)
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, 3000, "노트를 찾을 수 없습니다"),
    NOTE_ACCESS_DENIED(HttpStatus.FORBIDDEN, 3001, "노트에 대한 접근 권한이 없습니다"),
    NOTE_EDIT_PERMISSION_DENIED(HttpStatus.FORBIDDEN, 3002, "노트를 수정할 권한이 없습니다"),
    NOTE_DELETE_PERMISSION_DENIED(HttpStatus.FORBIDDEN, 3003, "노트를 삭제할 권한이 없습니다"),
    NOTE_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, 3004, "노트 콘텐츠를 찾을 수 없습니다"),
    NOTE_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, 3005, "노트 멤버를 찾을 수 없습니다"),

    // Docker Execution (4xxx)
    DOCKER_NOT_INSTALLED(HttpStatus.SERVICE_UNAVAILABLE, 4001, "Docker가 설치되지 않았습니다"),
    DOCKER_NOT_RUNNING(HttpStatus.SERVICE_UNAVAILABLE, 4002, "Docker가 실행 중이지 않습니다"),
    EXECUTION_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, 4010, "코드 실행 시간이 초과되었습니다"),
    EXECUTION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 4021, "코드 실행 중 오류가 발생했습니다"),

    // System (9xxx)
    SYSTEM_DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 9001, "데이터베이스 오류가 발생했습니다"),
    SYSTEM_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 9999, "일시적인 서버 오류가 발생했습니다"),

    // OAuthAccount (6xxx)
    PARSING_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 6001, "응답 파싱 중 오류가 발생했습니다"),
    OAUTH_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, 6002, "OAuthAccount 제공자로부터 오류 응답을 받았습니다");

    private final HttpStatus httpStatus;
    private final int code;
    private final String message;
}