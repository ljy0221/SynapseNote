package com.synapse.api.module.common.exception;

public enum ErrorCode {
    // ===== 인증/인가 (AUTH_) =====
    AUTH_INVALID_CREDENTIALS(401, "이메일 또는 비밀번호가 올바르지 않습니다."),
    AUTH_TOKEN_EXPIRED(401, "토큰이 만료되었습니다."),
    AUTH_INVALID_TOKEN(401, "유효하지 않은 토큰입니다."),
    AUTH_UNAUTHORIZED(401, "인증이 필요합니다."),
    AUTH_FORBIDDEN(403, "접근 권한이 없습니다."),
    AUTH_EMAIL_ALREADY_EXISTS(409, "이미 사용 중인 이메일입니다."),

    // ===== 검증 (VALIDATION_) =====
    VALIDATION_INVALID_INPUT(400, "입력값이 올바르지 않습니다."),
    VALIDATION_MISSING_FIELD(400, "필수 항목이 누락되었습니다."),
    VALIDATION_INVALID_EMAIL(400, "이메일 형식이 올바르지 않습니다."),
    VALIDATION_PASSWORD_TOO_SHORT(400, "비밀번호는 최소 8자 이상이어야 합니다."),
    VALIDATION_INVALID_PARAMETER(400, "잘못된 파라미터입니다."),

    // ===== 노트 (NOTE_) =====
    NOTE_NOT_FOUND(404, "노트를 찾을 수 없습니다."),
    NOTE_ALREADY_EXISTS(409, "이미 존재하는 노트입니다."),
    NOTE_TITLE_REQUIRED(400, "노트 제목은 필수입니다."),
    NOTE_TITLE_TOO_LONG(400, "노트 제목은 최대 200자까지 가능합니다."),
    NOTE_CONTENT_TOO_LARGE(413, "노트 내용이 너무 큽니다. (최대 10MB)"),
    NOTE_ACCESS_DENIED(403, "노트 접근 권한이 없습니다."),

    // ===== 폴더 (FOLDER_) =====
    FOLDER_NOT_FOUND(404, "폴더를 찾을 수 없습니다."),
    FOLDER_ALREADY_EXISTS(409, "이미 존재하는 폴더입니다."),
    FOLDER_NAME_REQUIRED(400, "폴더 이름은 필수입니다."),
    FOLDER_CANNOT_MOVE_TO_CHILD(400, "하위 폴더로 이동할 수 없습니다."),
    FOLDER_NOT_EMPTY(400, "폴더가 비어있지 않습니다."),
    FOLDER_ACCESS_DENIED(403, "폴더 접근 권한이 없습니다."),

    // ===== 버전 (VERSION_) =====
    VERSION_NOT_FOUND(404, "버전을 찾을 수 없습니다."),
    VERSION_INVALID_RANGE(400, "유효하지 않은 버전 범위입니다."),
    VERSION_CANNOT_RESTORE(400, "해당 버전으로 복원할 수 없습니다."),

    // ===== 코드 블록 (CODE_) =====
    CODE_BLOCK_NOT_FOUND(404, "코드 블록을 찾을 수 없습니다."),
    CODE_LANGUAGE_NOT_SUPPORTED(400, "지원하지 않는 언어입니다."),
    CODE_VERSION_NOT_SUPPORTED(400, "지원하지 않는 버전입니다."),
    CODE_EXECUTION_FAILED(500, "코드 실행에 실패했습니다."),
    CODE_EXECUTION_TIMEOUT(408, "코드 실행 시간이 초과되었습니다."),

    // ===== 검색 (SEARCH_) =====
    SEARCH_QUERY_TOO_SHORT(400, "검색어는 최소 2자 이상이어야 합니다."),
    SEARCH_QUERY_TOO_LONG(400, "검색어는 최대 100자까지 가능합니다."),
    SEARCH_SERVICE_UNAVAILABLE(503, "검색 서비스를 사용할 수 없습니다."),

    // ===== 사용자 (USER_) =====
    USER_NOT_FOUND(404, "사용자를 찾을 수 없습니다."),
    USER_ALREADY_EXISTS(409, "이미 존재하는 사용자입니다."),
    USER_DEACTIVATED(403, "비활성화된 사용자입니다."),

    // ===== 리소스 (RESOURCE_) =====
    RESOURCE_NOT_FOUND(404, "요청한 리소스를 찾을 수 없습니다."),
    RESOURCE_CONFLICT(409, "리소스 충돌이 발생했습니다."),

    // ===== 시스템 (SYSTEM_) =====
    SYSTEM_INTERNAL_ERROR(500, "서버 내부 오류가 발생했습니다."),
    SYSTEM_DATABASE_ERROR(500, "데이터베이스 오류가 발생했습니다."),
    SYSTEM_EXTERNAL_SERVICE_ERROR(502, "외부 서비스 연동 중 오류가 발생했습니다."),
    SYSTEM_SERVICE_UNAVAILABLE(503, "서비스를 일시적으로 사용할 수 없습니다."),
    SYSTEM_RATE_LIMIT_EXCEEDED(429, "요청 한도를 초과했습니다."),

    // ===== 파일 (FILE_) =====
    FILE_TOO_LARGE(413, "파일 크기가 너무 큽니다."),
    FILE_INVALID_TYPE(400, "지원하지 않는 파일 형식입니다."),
    FILE_UPLOAD_FAILED(500, "파일 업로드에 실패했습니다.");

    private final int status;
    private final String message;

    ErrorCode(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}