package com.synapse.api.module.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ErrorResponse 테스트")
class ErrorResponseTest {

    @Test
    @DisplayName("ErrorCode와 path로 ErrorResponse를 생성한다")
    void testOfWithErrorCodeAndPath() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        String path = "/api/v1/notes/123";

        ErrorResponse response = ErrorResponse.of(errorCode, path);

        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).isNotNull();
        assertThat(response.getError().getCode()).isEqualTo(errorCode.name());
        assertThat(response.getError().getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(response.getError().getPath()).isEqualTo(path);
        assertThat(response.getError().getTimestamp()).isNotNull();
        assertThat(response.getError().getDetails()).isNull();
    }

    @Test
    @DisplayName("ErrorCode, path, details로 ErrorResponse를 생성한다")
    void testOfWithErrorCodePathAndDetails() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        String path = "/api/v1/notes/123";
        Map<String, Object> details = new HashMap<>();
        details.put("noteId", "abc-123");
        details.put("userId", "user-456");

        ErrorResponse response = ErrorResponse.of(errorCode, path, details);

        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).isNotNull();
        assertThat(response.getError().getCode()).isEqualTo(errorCode.name());
        assertThat(response.getError().getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(response.getError().getPath()).isEqualTo(path);
        assertThat(response.getError().getDetails())
                .isNotNull()
                .hasSize(2)
                .containsEntry("noteId", "abc-123")
                .containsEntry("userId", "user-456");
    }

    @Test
    @DisplayName("BaseException과 path로 ErrorResponse를 생성한다")
    void testOfWithBaseExceptionAndPath() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND);
        String path = "/api/v1/notes/123";

        ErrorResponse response = ErrorResponse.of(exception, path);

        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).isNotNull();
        assertThat(response.getError().getCode()).isEqualTo(exception.getErrorCode().name());
        assertThat(response.getError().getMessage()).isEqualTo(exception.getMessage());
        assertThat(response.getError().getPath()).isEqualTo(path);
        assertThat(response.getError().getDetails()).isNull();
    }

    @Test
    @DisplayName("BaseException의 details가 비어있으면 ErrorResponse의 details는 null이다")
    void testOfWithBaseExceptionEmptyDetails() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND);
        String path = "/api/v1/notes/123";

        ErrorResponse response = ErrorResponse.of(exception, path);

        assertThat(response.getError().getDetails()).isNull();
    }

    @Test
    @DisplayName("BaseException의 details가 있으면 ErrorResponse에 포함된다")
    void testOfWithBaseExceptionNonEmptyDetails() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND)
                .addDetail("noteId", "abc-123")
                .addDetail("userId", "user-456");
        String path = "/api/v1/notes/123";

        ErrorResponse response = ErrorResponse.of(exception, path);

        assertThat(response.getError().getDetails())
                .isNotNull()
                .hasSize(2)
                .containsEntry("noteId", "abc-123")
                .containsEntry("userId", "user-456");
    }

    @Test
    @DisplayName("ErrorResponse의 success는 항상 false이다")
    void testSuccessIsAlwaysFalse() {
        ErrorResponse response1 = ErrorResponse.of(ErrorCode.NOTE_NOT_FOUND, "/api/v1/notes");
        ErrorResponse response2 = ErrorResponse.of(ErrorCode.AUTH_UNAUTHORIZED, "/api/v1/auth");

        assertThat(response1.isSuccess()).isFalse();
        assertThat(response2.isSuccess()).isFalse();
    }

    @Test
    @DisplayName("timestamp는 현재 시간으로 설정된다")
    void testTimestampIsCurrentTime() {
        LocalDateTime before = LocalDateTime.now();
        ErrorResponse response = ErrorResponse.of(ErrorCode.NOTE_NOT_FOUND, "/api/v1/notes");
        LocalDateTime after = LocalDateTime.now();

        assertThat(response.getError().getTimestamp())
                .isNotNull()
                .isAfterOrEqualTo(before)
                .isBeforeOrEqualTo(after);
    }

    @Test
    @DisplayName("Builder를 사용하여 ErrorResponse를 생성할 수 있다")
    void testBuilderPattern() {
        ErrorResponse.ErrorDetail errorDetail = ErrorResponse.ErrorDetail.builder()
                .code("CUSTOM_ERROR")
                .message("Custom error message")
                .timestamp(LocalDateTime.now())
                .path("/api/v1/custom")
                .build();

        ErrorResponse response = ErrorResponse.builder()
                .error(errorDetail)
                .build();

        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).isEqualTo(errorDetail);
    }

    @Test
    @DisplayName("ErrorDetail의 모든 필드는 getter를 통해 접근 가능하다")
    void testErrorDetailGetters() {
        String code = "TEST_CODE";
        String message = "Test message";
        LocalDateTime timestamp = LocalDateTime.now();
        String path = "/api/test";
        Map<String, Object> details = new HashMap<>();
        details.put("key", "value");

        ErrorResponse.ErrorDetail errorDetail = ErrorResponse.ErrorDetail.builder()
                .code(code)
                .message(message)
                .timestamp(timestamp)
                .path(path)
                .details(details)
                .build();

        assertThat(errorDetail.getCode()).isEqualTo(code);
        assertThat(errorDetail.getMessage()).isEqualTo(message);
        assertThat(errorDetail.getTimestamp()).isEqualTo(timestamp);
        assertThat(errorDetail.getPath()).isEqualTo(path);
        assertThat(errorDetail.getDetails()).isEqualTo(details);
    }

    @Test
    @DisplayName("빈 Map을 details로 전달하면 ErrorResponse에 빈 Map이 포함된다")
    void testOfWithEmptyDetailsMap() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        String path = "/api/v1/notes";
        Map<String, Object> emptyDetails = new HashMap<>();

        ErrorResponse response = ErrorResponse.of(errorCode, path, emptyDetails);

        assertThat(response.getError().getDetails())
                .isNotNull()
                .isEmpty();
    }

    @Test
    @DisplayName("BaseException의 커스텀 메시지가 ErrorResponse에 포함된다")
    void testOfWithCustomMessage() {
        String customMessage = "사용자 정의 오류 메시지";
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND, customMessage);
        String path = "/api/v1/notes";

        ErrorResponse response = ErrorResponse.of(exception, path);

        assertThat(response.getError().getMessage()).isEqualTo(customMessage);
        assertThat(response.getError().getCode()).isEqualTo("NOTE_NOT_FOUND");
    }

    @Test
    @DisplayName("서로 다른 ErrorCode로 생성된 ErrorResponse는 다른 code와 message를 가진다")
    void testDifferentErrorCodes() {
        ErrorResponse response1 = ErrorResponse.of(ErrorCode.NOTE_NOT_FOUND, "/path1");
        ErrorResponse response2 = ErrorResponse.of(ErrorCode.AUTH_UNAUTHORIZED, "/path2");

        assertThat(response1.getError().getCode()).isNotEqualTo(response2.getError().getCode());
        assertThat(response1.getError().getMessage()).isNotEqualTo(response2.getError().getMessage());
    }
}
