package com.synapse.api.module.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ErrorCode 테스트")
class ErrorCodeTest {

    @ParameterizedTest
    @EnumSource(ErrorCode.class)
    @DisplayName("모든 ErrorCode는 유효한 HTTP 상태 코드를 가져야 한다 (400-599)")
    void testAllErrorCodesHaveValidHttpStatus(ErrorCode errorCode) {
        int status = errorCode.getStatus();
        assertThat(status)
                .as("ErrorCode %s의 상태 코드는 400-599 범위여야 함", errorCode.name())
                .isBetween(400, 599);
    }

    @ParameterizedTest
    @EnumSource(ErrorCode.class)
    @DisplayName("모든 ErrorCode는 null이 아닌 메시지를 가져야 한다")
    void testAllErrorCodesHaveNonNullMessage(ErrorCode errorCode) {
        String message = errorCode.getMessage();
        assertThat(message)
                .as("ErrorCode %s의 메시지는 null이 아니어야 함", errorCode.name())
                .isNotNull()
                .isNotBlank();
    }

    @Test
    @DisplayName("AUTH_INVALID_CREDENTIALS는 401 상태 코드를 가진다")
    void testAuthInvalidCredentialsHas401Status() {
        assertThat(ErrorCode.AUTH_INVALID_CREDENTIALS.getStatus()).isEqualTo(401);
        assertThat(ErrorCode.AUTH_INVALID_CREDENTIALS.getMessage()).contains("이메일", "비밀번호");
    }

    @Test
    @DisplayName("AUTH_FORBIDDEN은 403 상태 코드를 가진다")
    void testAuthForbiddenHas403Status() {
        assertThat(ErrorCode.AUTH_FORBIDDEN.getStatus()).isEqualTo(403);
        assertThat(ErrorCode.AUTH_FORBIDDEN.getMessage()).contains("접근 권한");
    }

    @Test
    @DisplayName("NOTE_NOT_FOUND는 404 상태 코드를 가진다")
    void testNoteNotFoundHas404Status() {
        assertThat(ErrorCode.NOTE_NOT_FOUND.getStatus()).isEqualTo(404);
        assertThat(ErrorCode.NOTE_NOT_FOUND.getMessage()).contains("노트");
    }

    @Test
    @DisplayName("VALIDATION_INVALID_INPUT은 400 상태 코드를 가진다")
    void testValidationInvalidInputHas400Status() {
        assertThat(ErrorCode.VALIDATION_INVALID_INPUT.getStatus()).isEqualTo(400);
        assertThat(ErrorCode.VALIDATION_INVALID_INPUT.getMessage()).contains("입력값");
    }

    @Test
    @DisplayName("SYSTEM_INTERNAL_ERROR는 500 상태 코드를 가진다")
    void testSystemInternalErrorHas500Status() {
        assertThat(ErrorCode.SYSTEM_INTERNAL_ERROR.getStatus()).isEqualTo(500);
        assertThat(ErrorCode.SYSTEM_INTERNAL_ERROR.getMessage()).contains("서버");
    }

    @Test
    @DisplayName("CODE_EXECUTION_TIMEOUT은 408 상태 코드를 가진다")
    void testCodeExecutionTimeoutHas408Status() {
        assertThat(ErrorCode.CODE_EXECUTION_TIMEOUT.getStatus()).isEqualTo(408);
        assertThat(ErrorCode.CODE_EXECUTION_TIMEOUT.getMessage()).contains("시간이 초과");
    }

    @Test
    @DisplayName("AUTH_EMAIL_ALREADY_EXISTS는 409 상태 코드를 가진다")
    void testAuthEmailAlreadyExistsHas409Status() {
        assertThat(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS.getStatus()).isEqualTo(409);
        assertThat(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS.getMessage()).contains("이메일");
    }

    @Test
    @DisplayName("FILE_TOO_LARGE는 413 상태 코드를 가진다")
    void testFileTooLargeHas413Status() {
        assertThat(ErrorCode.FILE_TOO_LARGE.getStatus()).isEqualTo(413);
        assertThat(ErrorCode.FILE_TOO_LARGE.getMessage()).contains("파일");
    }

    @Test
    @DisplayName("SYSTEM_RATE_LIMIT_EXCEEDED는 429 상태 코드를 가진다")
    void testSystemRateLimitExceededHas429Status() {
        assertThat(ErrorCode.SYSTEM_RATE_LIMIT_EXCEEDED.getStatus()).isEqualTo(429);
        assertThat(ErrorCode.SYSTEM_RATE_LIMIT_EXCEEDED.getMessage()).contains("한도");
    }

    @Test
    @DisplayName("SYSTEM_EXTERNAL_SERVICE_ERROR는 502 상태 코드를 가진다")
    void testSystemExternalServiceErrorHas502Status() {
        assertThat(ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR.getStatus()).isEqualTo(502);
        assertThat(ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR.getMessage()).contains("외부 서비스");
    }

    @Test
    @DisplayName("SEARCH_SERVICE_UNAVAILABLE은 503 상태 코드를 가진다")
    void testSearchServiceUnavailableHas503Status() {
        assertThat(ErrorCode.SEARCH_SERVICE_UNAVAILABLE.getStatus()).isEqualTo(503);
        assertThat(ErrorCode.SEARCH_SERVICE_UNAVAILABLE.getMessage()).contains("검색 서비스");
    }

    @Test
    @DisplayName("AUTH 카테고리의 모든 에러는 401 또는 403 또는 409 상태 코드를 가진다")
    void testAuthErrorsHaveCorrectStatusCodes() {
        assertThat(ErrorCode.AUTH_INVALID_CREDENTIALS.getStatus()).isIn(401, 403, 409);
        assertThat(ErrorCode.AUTH_TOKEN_EXPIRED.getStatus()).isIn(401, 403, 409);
        assertThat(ErrorCode.AUTH_INVALID_TOKEN.getStatus()).isIn(401, 403, 409);
        assertThat(ErrorCode.AUTH_UNAUTHORIZED.getStatus()).isIn(401, 403, 409);
        assertThat(ErrorCode.AUTH_FORBIDDEN.getStatus()).isIn(401, 403, 409);
        assertThat(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS.getStatus()).isIn(401, 403, 409);
    }

    @Test
    @DisplayName("VALIDATION 카테고리의 모든 에러는 400 상태 코드를 가진다")
    void testValidationErrorsHave400StatusCode() {
        assertThat(ErrorCode.VALIDATION_INVALID_INPUT.getStatus()).isEqualTo(400);
        assertThat(ErrorCode.VALIDATION_MISSING_FIELD.getStatus()).isEqualTo(400);
        assertThat(ErrorCode.VALIDATION_INVALID_EMAIL.getStatus()).isEqualTo(400);
        assertThat(ErrorCode.VALIDATION_PASSWORD_TOO_SHORT.getStatus()).isEqualTo(400);
        assertThat(ErrorCode.VALIDATION_INVALID_PARAMETER.getStatus()).isEqualTo(400);
    }

    @Test
    @DisplayName("ErrorCode enum은 최소 40개 이상의 상수를 가진다")
    void testErrorCodeHasMinimum40Constants() {
        ErrorCode[] values = ErrorCode.values();
        assertThat(values).hasSizeGreaterThanOrEqualTo(40);
    }
}
