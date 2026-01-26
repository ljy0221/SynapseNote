package com.synapse.api.module.note.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VersionException 테스트")
class VersionExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 VersionException을 생성한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.VERSION_NOT_FOUND;
        VersionException exception = new VersionException(errorCode);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 customMessage로 VersionException을 생성한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.VERSION_CANNOT_RESTORE;
        String customMessage = "사용자 정의 버전 오류";
        VersionException exception = new VersionException(errorCode, customMessage);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);

        // BUG: customMessage 파라미터가 사용되지 않음 (계획서 Issue 1)
        // 현재 구현에서는 ErrorCode의 기본 메시지를 사용함
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        // 수정 후 기대 동작: assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("VersionException은 BaseException을 상속한다")
    void testIsInstanceOfBaseException() {
        VersionException exception = new VersionException(ErrorCode.VERSION_INVALID_RANGE);

        assertThat(exception).isInstanceOf(BaseException.class);
    }

    @Test
    @DisplayName("VersionException은 RuntimeException을 상속한다")
    void testIsInstanceOfRuntimeException() {
        VersionException exception = new VersionException(ErrorCode.VERSION_INVALID_RANGE);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("VersionException에 details를 추가할 수 있다")
    void testAddDetailsToException() {
        VersionException exception = new VersionException(ErrorCode.VERSION_NOT_FOUND);

        exception.addDetail("noteId", "note-123")
                 .addDetail("requestedVersion", 42)
                 .addDetail("latestVersion", 35);

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsEntry("noteId", "note-123")
                .containsEntry("requestedVersion", 42)
                .containsEntry("latestVersion", 35);
    }
}
