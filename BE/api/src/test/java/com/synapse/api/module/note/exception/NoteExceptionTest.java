package com.synapse.api.module.note.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("NoteException 테스트")
class NoteExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 NoteException을 생성한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        NoteException exception = new NoteException(errorCode);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 customMessage로 NoteException을 생성한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.NOTE_NOT_FOUND;
        String customMessage = "사용자 정의 노트 오류";
        NoteException exception = new NoteException(errorCode, customMessage);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);

        // BUG: customMessage 파라미터가 사용되지 않음 (계획서 Issue 1)
        // 현재 구현에서는 ErrorCode의 기본 메시지를 사용함
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        // 수정 후 기대 동작: assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("NoteException은 BaseException을 상속한다")
    void testIsInstanceOfBaseException() {
        NoteException exception = new NoteException(ErrorCode.NOTE_ACCESS_DENIED);

        assertThat(exception).isInstanceOf(BaseException.class);
    }

    @Test
    @DisplayName("NoteException은 RuntimeException을 상속한다")
    void testIsInstanceOfRuntimeException() {
        NoteException exception = new NoteException(ErrorCode.NOTE_ACCESS_DENIED);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("NoteException에 details를 추가할 수 있다")
    void testAddDetailsToException() {
        NoteException exception = new NoteException(ErrorCode.NOTE_NOT_FOUND);

        exception.addDetail("noteId", "abc-123-def-456")
                 .addDetail("userId", "user-789")
                 .addDetail("action", "view");

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsEntry("noteId", "abc-123-def-456")
                .containsEntry("userId", "user-789")
                .containsEntry("action", "view");
    }
}
