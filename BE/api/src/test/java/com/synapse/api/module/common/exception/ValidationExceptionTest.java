package com.synapse.api.module.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ValidationException 테스트")
class ValidationExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 ValidationException을 생성한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.VALIDATION_INVALID_INPUT;
        ValidationException exception = new ValidationException(errorCode);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 customMessage로 ValidationException을 생성한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.VALIDATION_INVALID_INPUT;
        String customMessage = "사용자 정의 검증 오류";
        ValidationException exception = new ValidationException(errorCode, customMessage);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);

        // BUG: customMessage 파라미터가 사용되지 않음 (계획서 Issue 1)
        // 현재 구현에서는 ErrorCode의 기본 메시지를 사용함
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        // 수정 후 기대 동작: assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("ValidationException은 BaseException을 상속한다")
    void testIsInstanceOfBaseException() {
        ValidationException exception = new ValidationException(ErrorCode.VALIDATION_INVALID_INPUT);

        assertThat(exception).isInstanceOf(BaseException.class);
    }

    @Test
    @DisplayName("ValidationException은 RuntimeException을 상속한다")
    void testIsInstanceOfRuntimeException() {
        ValidationException exception = new ValidationException(ErrorCode.VALIDATION_INVALID_INPUT);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("ValidationException에 details를 추가할 수 있다")
    void testAddDetailsToException() {
        ValidationException exception = new ValidationException(ErrorCode.VALIDATION_INVALID_EMAIL);

        exception.addDetail("field", "email")
                 .addDetail("value", "invalid-email")
                 .addDetail("reason", "Missing @ symbol");

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsEntry("field", "email")
                .containsEntry("value", "invalid-email")
                .containsEntry("reason", "Missing @ symbol");
    }
}
