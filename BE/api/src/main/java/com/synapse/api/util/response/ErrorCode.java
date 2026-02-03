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
    INVALID_ENUM_TYPE(HttpStatus.BAD_REQUEST, "COMMON_005", "ENUM 타입이 올바르지 않습니다"),

    // Auth
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_001", "인증되지 않은 사용자입니다"),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_002", "접근 권한이 없습니다"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_003", "토큰이 만료되었습니다"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_004", "토큰이 잘못되었습니다"),
    HEADER_INVALID(HttpStatus.FORBIDDEN, "AUTH_005", "인증 헤더가 잘못되었습니다"),
    INVALID_REFRESH_TOKEN(HttpStatus.FORBIDDEN, "AUTH_006", "리프레시 토큰이 유효하지 않습니다"),
    NOT_FOUND_REFRESH(HttpStatus.FORBIDDEN, "AUTH_007", "리프레시 토큰이 존재하지 않습니다"),

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_001", "사용자를 찾을 수 없습니다"),
    MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT, "MEMBER_002", "이미 존재하는 사용자입니다"),
    VALIDATION_INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "MEMBER_003", "잘못된 요청 파라미터입니다"),
    MEMBER_ALREADY_EXISTS_ANOTHER_PROVIDER(HttpStatus.CONFLICT, "MEMBER_004", "이 이메일은 다른 소셜 로그인으로 이미 가입되어 있습니다"),

    // Note
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_001", "노트를 찾을 수 없습니다"),
    NOTE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "NOTE_002", "노트에 대한 접근 권한이 없습니다"),
    NOTE_EDIT_PERMISSION_DENIED(HttpStatus.FORBIDDEN, "NOTE_003", "노트를 수정할 권한이 없습니다"),
    NOTE_DELETE_PERMISSION_DENIED(HttpStatus.FORBIDDEN, "NOTE_004", "노트를 삭제할 권한이 없습니다"),
    NOTE_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_005", "노트 콘텐츠를 찾을 수 없습니다"),
    NOTE_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_006", "노트 멤버를 찾을 수 없습니다"),
    CODE_BLOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_007", "코드 블록을 찾을 수 없습니다"),

    // Invitation (NOTE_010 ~ NOTE_019)
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTE_010", "초대를 찾을 수 없습니다"),
    INVITATION_EXPIRED(HttpStatus.GONE, "NOTE_011", "초대가 만료되었습니다"),
    INVITATION_ALREADY_EXISTS(HttpStatus.CONFLICT, "NOTE_012", "이미 초대가 존재합니다"),
    INVITATION_EMAIL_MISMATCH(HttpStatus.FORBIDDEN, "NOTE_013", "초대 이메일과 사용자 이메일이 일치하지 않습니다"),
    INVITATION_NOT_ACCEPTABLE(HttpStatus.BAD_REQUEST, "NOTE_014", "수락할 수 없는 초대입니다"),
    INVITATION_OWNER_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "NOTE_015", "OWNER 권한으로는 초대할 수 없습니다"),
    ALREADY_NOTE_MEMBER(HttpStatus.CONFLICT, "NOTE_016", "이미 노트 멤버입니다"),
    CANNOT_CHANGE_OWN_ROLE(HttpStatus.BAD_REQUEST, "NOTE_017", "자신의 권한은 변경할 수 없습니다"),
    CANNOT_REMOVE_SELF(HttpStatus.BAD_REQUEST, "NOTE_018", "자기 자신은 삭제할 수 없습니다"),
    INVITATION_ONLY_OWNER(HttpStatus.FORBIDDEN, "NOTE_019", "초대는 OWNER만 가능합니다"),

    // Mindmap
    NOTE_NOT_IN_MINDMAP(HttpStatus.NOT_FOUND, "MINDMAP_001", "노트가 마인드맵에 존재하지않습니다."),
    MINDMAP_EDGE_NOT_DELETABLE(HttpStatus.FORBIDDEN, "MINDMAP_002", "연결이 존재하지 않거나 삭제 권한이 없습니다."),

    // Docker Execution
    DOCKER_NOT_INSTALLED(HttpStatus.SERVICE_UNAVAILABLE, "DOCKER_001", "Docker가 설치되지 않았습니다"),
    DOCKER_NOT_RUNNING(HttpStatus.SERVICE_UNAVAILABLE, "DOCKER_002", "Docker가 실행 중이지 않습니다"),
    EXECUTION_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, "DOCKER_003", "코드 실행 시간이 초과되었습니다"),
    EXECUTION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "DOCKER_004", "코드 실행 중 오류가 발생했습니다"),

    // System
    SYSTEM_DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_001", "데이터베이스 오류가 발생했습니다"),
    SYSTEM_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYSTEM_002", "일시적인 서버 오류가 발생했습니다"),

    // OAuthAccount
    OAUTH_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "OAUTH_001", "OAuth2 제공자로부터 오류 응답을 받았습니다"),
    OAUTH_TOKEN_ISSUE(HttpStatus.BAD_GATEWAY, "OAUTH_002", "OAuth2 제공자로부터 Access Token을 받지 못했습니다"),

    // AWS S3
    IMAGE_DELETE_FAIL(HttpStatus.BAD_GATEWAY, "IMAGE_001", "이미지 삭제 중 스토리지 서버(S3)와의 통신에 실패했습니다."),
    IMAGE_INVALID_EXTENSION(HttpStatus.BAD_REQUEST, "IMAGE_002", "허용되지 않는 이미지 확장자입니다."),

    // BlockDocument
    REQUIRED_BLOCK_CONTENTS(HttpStatus.BAD_REQUEST, "BLOCK_001", "블록 content의 필수 값이 누락되었습니다."),
    INVALID_BLOCK_CONTENTS(HttpStatus.BAD_REQUEST, "BLOCK_002", "블록 content 형식이 올바르지 않습니다."),
    INVALID_BLOCK_TYPE(HttpStatus.BAD_REQUEST, "BLOCK_003", "블록 타입이 올바르지 않습니다."),
    UNSUPPORTED_LANGUAGE(HttpStatus.BAD_REQUEST, "BLOCK_004", "지원하지 않는 언어 타입입니다."),
    UNSUPPORTED_BLOCK_TYPE(HttpStatus.BAD_REQUEST, "BLOCK_005", "지원하지 않는 블록 타입입니다."),
    BLOCK_HISTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "BLOCK_006", "블록 히스토리를 찾을 수 없습니다."),
    BLOCK_ROLLBACK_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "BLOCK_007", "블록 롤백에 실패했습니다."),
    BLOCK_VERSION_CONFLICT(HttpStatus.CONFLICT, "BLOCK_008", "블록 버전 충돌이 발생했습니다."),
    INVALID_SLOT_NUMBER(HttpStatus.BAD_REQUEST, "BLOCK_009", "슬롯 번호는 1-5 범위여야 합니다."),
    INVALID_BLOCK_TYPE_FOR_HISTORY(HttpStatus.BAD_REQUEST, "BLOCK_010", "히스토리 기능은 코드 블록에서만 사용할 수 있습니다."),

    // AI
    AI_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "AI_001", "코드 길이가 너무 깁니다.(500자)"),
    AI_INVALID_RESPONSE(HttpStatus.BAD_REQUEST, "AI_002", "잘못된 응답입니다."),
    AI_PROVIDER_NOT_SUPPORTED(HttpStatus.NOT_FOUND, "AI_003", "지원하지 않는 모델입니다."),
    AI_SERVICE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "AI_004", "AI 서버가 응답하지 않습니다."),
    AI_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, "AI_005", "응답시간이 초과되었습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}