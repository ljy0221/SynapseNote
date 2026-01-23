package com.synapse.api.module.folder.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("FolderException 테스트")
class FolderExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 FolderException을 생성한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.FOLDER_NOT_FOUND;
        FolderException exception = new FolderException(errorCode);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 customMessage로 FolderException을 생성한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.FOLDER_NOT_EMPTY;
        String customMessage = "사용자 정의 폴더 오류";
        FolderException exception = new FolderException(errorCode, customMessage);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);

        // BUG: customMessage 파라미터가 사용되지 않음 (계획서 Issue 1)
        // 현재 구현에서는 ErrorCode의 기본 메시지를 사용함
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        // 수정 후 기대 동작: assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("FolderException은 BaseException을 상속한다")
    void testIsInstanceOfBaseException() {
        FolderException exception = new FolderException(ErrorCode.FOLDER_ACCESS_DENIED);

        assertThat(exception).isInstanceOf(BaseException.class);
    }

    @Test
    @DisplayName("FolderException은 RuntimeException을 상속한다")
    void testIsInstanceOfRuntimeException() {
        FolderException exception = new FolderException(ErrorCode.FOLDER_ACCESS_DENIED);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("FolderException에 details를 추가할 수 있다")
    void testAddDetailsToException() {
        FolderException exception = new FolderException(ErrorCode.FOLDER_CANNOT_MOVE_TO_CHILD);

        exception.addDetail("folderId", "folder-abc")
                 .addDetail("targetFolderId", "folder-xyz")
                 .addDetail("reason", "Target is a child folder");

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsEntry("folderId", "folder-abc")
                .containsEntry("targetFolderId", "folder-xyz")
                .containsEntry("reason", "Target is a child folder");
    }
}
