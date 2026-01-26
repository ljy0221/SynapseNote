package com.synapse.api.module.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("BaseException 테스트")
class BaseExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 생성 - 메시지는 ErrorCode의 기본 메시지를 사용한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        BaseException exception = new BaseException(errorCode);

        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 커스텀 메시지로 생성 - 커스텀 메시지를 사용한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        String customMessage = "사용자 정의 메시지";
        BaseException exception = new BaseException(errorCode, customMessage);

        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(customMessage);
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 details Map으로 생성 - details를 포함한다")
    void testConstructorWithDetails() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        Map<String, Object> details = new HashMap<>();
        details.put("noteId", "abc-123");
        details.put("userId", "user-456");

        BaseException exception = new BaseException(errorCode, details);

        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails())
                .isNotNull()
                .hasSize(2)
                .containsEntry("noteId", "abc-123")
                .containsEntry("userId", "user-456");
    }

    @Test
    @DisplayName("addDetail() 메서드로 상세 정보를 추가할 수 있다")
    void testAddDetailMethod() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND);

        BaseException result = exception.addDetail("noteId", "abc-123");

        assertThat(result).isSameAs(exception);  // Fluent API - 자기 자신 반환
        assertThat(exception.getDetails())
                .hasSize(1)
                .containsEntry("noteId", "abc-123");
    }

    @Test
    @DisplayName("addDetail()을 체이닝하여 여러 상세 정보를 추가할 수 있다")
    void testAddDetailChaining() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND)
                .addDetail("noteId", "abc-123")
                .addDetail("userId", "user-456")
                .addDetail("timestamp", System.currentTimeMillis());

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsKeys("noteId", "userId", "timestamp");
    }

    @Test
    @DisplayName("BaseException은 RuntimeException을 상속한다")
    void testIsRuntimeException() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("getErrorCode()는 생성 시 전달된 ErrorCode를 반환한다")
    void testGetErrorCode() {
        ErrorCode errorCode = ErrorCode.VALIDATION_INVALID_INPUT;
        BaseException exception = new BaseException(errorCode);

        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
    }

    @Test
    @DisplayName("getDetails()는 불변이 아니므로 수정 가능하다")
    void testGetDetailsIsMutable() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND);
        Map<String, Object> details = exception.getDetails();

        details.put("test", "value");

        assertThat(exception.getDetails()).containsEntry("test", "value");
    }

    @Test
    @DisplayName("동일한 키로 addDetail()을 호출하면 값이 덮어씌워진다")
    void testAddDetailOverwritesExistingKey() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND)
                .addDetail("noteId", "old-value")
                .addDetail("noteId", "new-value");

        assertThat(exception.getDetails())
                .hasSize(1)
                .containsEntry("noteId", "new-value");
    }

    @Test
    @DisplayName("빈 Map으로 생성하면 details는 빈 Map이다")
    void testConstructorWithEmptyDetails() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND, new HashMap<>());

        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("null 키로 addDetail()을 호출할 수 있다 (Map 동작과 동일)")
    void testAddDetailWithNullKey() {
        BaseException exception = new BaseException(ErrorCode.NOTE_NOT_FOUND)
                .addDetail(null, "value");

        assertThat(exception.getDetails())
                .hasSize(1)
                .containsEntry(null, "value");
    }
}
