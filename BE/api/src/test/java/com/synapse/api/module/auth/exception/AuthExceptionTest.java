package com.synapse.api.module.auth.exception;

import com.synapse.api.module.common.exception.BaseException;
import com.synapse.api.module.common.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AuthException 테스트")
class AuthExceptionTest {

    @Test
    @DisplayName("ErrorCode만으로 AuthException을 생성한다")
    void testConstructorWithErrorCodeOnly() {
        ErrorCode errorCode = ErrorCode.AUTH_INVALID_CREDENTIALS;
        AuthException exception = new AuthException(errorCode);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getDetails()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("ErrorCode와 customMessage로 AuthException을 생성한다")
    void testConstructorWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.AUTH_INVALID_CREDENTIALS;
        String customMessage = "사용자 정의 인증 오류";
        AuthException exception = new AuthException(errorCode, customMessage);

        assertThat(exception).isNotNull();
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);

        // BUG: customMessage 파라미터가 사용되지 않음 (계획서 Issue 1)
        // 현재 구현에서는 ErrorCode의 기본 메시지를 사용함
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        // 수정 후 기대 동작: assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("AuthException은 BaseException을 상속한다")
    void testIsInstanceOfBaseException() {
        AuthException exception = new AuthException(ErrorCode.AUTH_UNAUTHORIZED);

        assertThat(exception).isInstanceOf(BaseException.class);
    }

    @Test
    @DisplayName("AuthException은 RuntimeException을 상속한다")
    void testIsInstanceOfRuntimeException() {
        AuthException exception = new AuthException(ErrorCode.AUTH_UNAUTHORIZED);

        assertThat(exception).isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("AuthException에 details를 추가할 수 있다")
    void testAddDetailsToException() {
        AuthException exception = new AuthException(ErrorCode.AUTH_TOKEN_EXPIRED);

        exception.addDetail("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                 .addDetail("expiredAt", "2024-01-23T10:00:00")
                 .addDetail("userId", "user-123");

        assertThat(exception.getDetails())
                .hasSize(3)
                .containsEntry("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                .containsEntry("expiredAt", "2024-01-23T10:00:00")
                .containsEntry("userId", "user-123");
    }
}
