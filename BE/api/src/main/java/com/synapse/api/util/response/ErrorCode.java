package com.synapse.api.util.response;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "COMMON_001", "잘못된 입력 값입니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON_002", "지원하지 않는 HTTP 메서드입니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_003", "서버 내부 오류가 발생했습니다"),
    INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "COMMON_004", "잘못된 타입입니다"),

    // Auth
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_001", "인증되지 않은 사용자입니다"),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_002", "접근 권한이 없습니다"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_003", "토큰이 만료되었습니다"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_004", "토큰이 잘못되었습니다"),
    HEADER_INVALID(HttpStatus.FORBIDDEN, "AUTH_005", "인증 헤더가 잘못되었습니다"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "사용자를 찾을 수 없습니다"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER_002", "이미 존재하는 사용자입니다"),
    VALIDATION_INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "USER_003", "잘못된 요청 파라미터입니다"),
    USER_ALREADY_EXISTS_ANOTHER_PROVIDER(HttpStatus.CONFLICT, "USER_004", "이 이메일은 다른 소셜 로그인으로 이미 가입되어 있습니다"),

    // Note
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_001", "노트를 찾을 수 없습니다"),
    NOTE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "NOTE_002", "노트에 대한 접근 권한이 없습니다"),
    NOTE_EDIT_PERMISSION_DENIED(HttpStatus.FORBIDDEN, "NOTE_003", "노트를 수정할 권한이 없습니다"),
    NOTE_DELETE_PERMISSION_DENIED(HttpStatus.FORBIDDEN, "NOTE_004", "노트를 삭제할 권한이 없습니다"),
    NOTE_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_005", "노트 콘텐츠를 찾을 수 없습니다"),
    NOTE_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_006", "노트 멤버를 찾을 수 없습니다"),
    CODE_BLOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_007", "코드 블록을 찾을 수 없습니다"),

    // Docker Execution
    DOCKER_NOT_INSTALLED(HttpStatus.SERVICE_UNAVAILABLE, "DOCKER_001", "Docker가 설치되지 않았습니다"),
    DOCKER_NOT_RUNNING(HttpStatus.SERVICE_UNAVAILABLE, "DOCKER_002", "Docker가 실행 중이지 않습니다"),
    EXECUTION_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, "DOCKER_003", "코드 실행 시간이 초과되었습니다"),
    EXECUTION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "DOCKER_004", "코드 실행 중 오류가 발생했습니다"),

    // System
    SYSTEM_DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_001", "데이터베이스 오류가 발생했습니다"),
    SYSTEM_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_002", "일시적인 서버 오류가 발생했습니다"),

    // OAuthAccount
    PARSING_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "OAUTH_001", "응답 파싱 중 오류가 발생했습니다"),
    OAUTH_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "OAUTH_002", "OAuth2 제공자로부터 오류 응답을 받았습니다"),
    OAUTH_TOKEN_ISSUE(HttpStatus.BAD_GATEWAY, "OAUTH_003", "OAuth2 제공자로부터 Access Token을 받지 못했습니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}