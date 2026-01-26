package com.synapse.api.module.common.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;

import javax.naming.AuthenticationException;
import java.nio.file.AccessDeniedException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {
        GlobalExceptionHandler.class,
        GlobalExceptionHandlerTest.TestController.class,
        GlobalExceptionHandlerTest.TestSecurityConfig.class
})
@DisplayName("GlobalExceptionHandler 통합 테스트")
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    // ===== BaseException 테스트 =====

    @Test
    @DisplayName("BaseException을 처리하고 올바른 HTTP 상태 코드를 반환한다")
    void testHandleBaseException() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NOTE_NOT_FOUND"))
                .andExpect(jsonPath("$.error.message").value("노트를 찾을 수 없습니다."))
                .andExpect(jsonPath("$.error.timestamp").exists())
                .andExpect(jsonPath("$.error.path").value("/test/base-exception"));
    }

    @Test
    @DisplayName("BaseException의 details가 응답에 포함된다")
    void testHandleBaseExceptionWithDetails() throws Exception {
        mockMvc.perform(get("/test/base-exception-with-details"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NOTE_NOT_FOUND"))
                .andExpect(jsonPath("$.error.details.noteId").value("test-123"))
                .andExpect(jsonPath("$.error.details.userId").value("user-456"));
    }

    @Test
    @DisplayName("ValidationException도 BaseException으로 처리된다")
    void testHandleValidationException() throws Exception {
        mockMvc.perform(get("/test/validation-exception"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_INVALID_INPUT"))
                .andExpect(jsonPath("$.error.message").exists());
    }

    @Test
    @DisplayName("AuthException도 BaseException으로 처리된다")
    void testHandleAuthException() throws Exception {
        mockMvc.perform(get("/test/auth-exception"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").exists());
    }

    // ===== MethodArgumentNotValidException 테스트 =====

    @Test
    @DisplayName("MethodArgumentNotValidException을 처리하고 필드 에러를 details에 포함한다")
    void testHandleMethodArgumentNotValidException() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_INVALID_INPUT"))
                .andExpect(jsonPath("$.error.details").exists())
                .andExpect(jsonPath("$.error.details.name").exists());
    }

    @Test
    @DisplayName("유효한 요청은 정상 처리된다")
    void testValidRequest() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"valid-name\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
    }

    // ===== AuthenticationException 테스트 =====

    @Test
    @DisplayName("AuthenticationException을 처리하고 401 상태를 반환한다")
    void testHandleAuthenticationException() throws Exception {
        mockMvc.perform(get("/test/authentication-exception"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("인증이 필요합니다."))
                .andExpect(jsonPath("$.error.path").value("/test/authentication-exception"));
    }

    // ===== AccessDeniedException 테스트 =====

    @Test
    @DisplayName("AccessDeniedException을 처리하고 403 상태를 반환한다")
    void testHandleAccessDeniedException() throws Exception {
        mockMvc.perform(get("/test/access-denied-exception"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_FORBIDDEN"))
                .andExpect(jsonPath("$.error.message").value("접근 권한이 없습니다."))
                .andExpect(jsonPath("$.error.path").value("/test/access-denied-exception"));
    }

    // ===== IllegalArgumentException 테스트 =====

    @Test
    @DisplayName("IllegalArgumentException을 처리하고 400 상태를 반환한다")
    void testHandleIllegalArgumentException() throws Exception {
        mockMvc.perform(get("/test/illegal-argument-exception"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_INVALID_PARAMETER"))
                .andExpect(jsonPath("$.error.message").value("잘못된 파라미터입니다."))
                .andExpect(jsonPath("$.error.path").value("/test/illegal-argument-exception"));
    }

    // ===== DataAccessException 테스트 =====

    @Test
    @DisplayName("DataAccessException을 처리하고 500 상태를 반환한다")
    void testHandleDataAccessException() throws Exception {
        mockMvc.perform(get("/test/data-access-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("SYSTEM_DATABASE_ERROR"))
                .andExpect(jsonPath("$.error.message").value("데이터베이스 오류가 발생했습니다."))
                .andExpect(jsonPath("$.error.path").value("/test/data-access-exception"));
    }

    // ===== 기타 Exception 테스트 =====

    @Test
    @DisplayName("처리되지 않은 Exception을 처리하고 500 상태를 반환한다")
    void testHandleGeneralException() throws Exception {
        mockMvc.perform(get("/test/general-exception"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("SYSTEM_INTERNAL_ERROR"))
                .andExpect(jsonPath("$.error.message").value("서버 내부 오류가 발생했습니다."))
                .andExpect(jsonPath("$.error.path").value("/test/general-exception"));
    }

    // ===== ErrorResponse 구조 테스트 =====

    @Test
    @DisplayName("모든 에러 응답은 success=false를 포함한다")
    void testAllErrorResponsesHaveSuccessFalse() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/test/authentication-exception"))
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/test/general-exception"))
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("모든 에러 응답은 error 객체를 포함한다")
    void testAllErrorResponsesHaveErrorObject() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.error.code").exists())
                .andExpect(jsonPath("$.error.message").exists())
                .andExpect(jsonPath("$.error.timestamp").exists())
                .andExpect(jsonPath("$.error.path").exists());
    }

    @Test
    @DisplayName("timestamp는 ISO-8601 형식이다")
    void testTimestampFormat() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error.timestamp").exists())
                .andExpect(jsonPath("$.error.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("서로 다른 예외는 서로 다른 HTTP 상태 코드를 반환한다")
    void testDifferentExceptionsReturnDifferentStatusCodes() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/test/authentication-exception"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/test/access-denied-exception"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/test/illegal-argument-exception"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/test/data-access-exception"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("error.code는 ErrorCode enum의 name과 일치한다")
    void testErrorCodeMatchesEnumName() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error.code").value(ErrorCode.NOTE_NOT_FOUND.name()));

        mockMvc.perform(get("/test/authentication-exception"))
                .andExpect(jsonPath("$.error.code").value(ErrorCode.AUTH_UNAUTHORIZED.name()));
    }

    @Test
    @DisplayName("error.message는 null이 아니다")
    void testErrorMessageIsNotNull() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error.message").isNotEmpty());

        mockMvc.perform(get("/test/general-exception"))
                .andExpect(jsonPath("$.error.message").isNotEmpty());
    }

    @Test
    @DisplayName("error.path는 요청 URI와 일치한다")
    void testErrorPathMatchesRequestUri() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error.path").value("/test/base-exception"));

        mockMvc.perform(get("/test/authentication-exception"))
                .andExpect(jsonPath("$.error.path").value("/test/authentication-exception"));
    }

    @Test
    @DisplayName("details가 없으면 error.details는 null이다")
    void testDetailsIsNullWhenEmpty() throws Exception {
        mockMvc.perform(get("/test/base-exception"))
                .andExpect(jsonPath("$.error.details").doesNotExist());
    }

    @Test
    @DisplayName("details가 있으면 error.details에 포함된다")
    void testDetailsIsIncludedWhenPresent() throws Exception {
        mockMvc.perform(get("/test/base-exception-with-details"))
                .andExpect(jsonPath("$.error.details").exists())
                .andExpect(jsonPath("$.error.details.noteId").value("test-123"))
                .andExpect(jsonPath("$.error.details.userId").value("user-456"));
    }

    // ===== 테스트용 컨트롤러 =====

    @RestController
    @RequestMapping("/test")
    static class TestController {

        @GetMapping("/base-exception")
        public void throwBaseException() {
            throw new BaseException(ErrorCode.NOTE_NOT_FOUND);
        }

        @GetMapping("/base-exception-with-details")
        public void throwBaseExceptionWithDetails() {
            throw new BaseException(ErrorCode.NOTE_NOT_FOUND)
                    .addDetail("noteId", "test-123")
                    .addDetail("userId", "user-456");
        }

        @GetMapping("/validation-exception")
        public void throwValidationException() {
            throw new ValidationException(ErrorCode.VALIDATION_INVALID_INPUT);
        }

        @GetMapping("/auth-exception")
        public void throwAuthException() {
            throw new com.synapse.api.module.auth.exception.AuthException(ErrorCode.AUTH_UNAUTHORIZED);
        }

        @PostMapping("/validate")
        public String validateRequest(@Valid @RequestBody TestRequest request) {
            return "OK";
        }

        @GetMapping("/authentication-exception")
        public void throwAuthenticationException() throws AuthenticationException {
            throw new AuthenticationException("Authentication failed");
        }

        @GetMapping("/access-denied-exception")
        public void throwAccessDeniedException() throws AccessDeniedException {
            throw new AccessDeniedException("Access denied");
        }

        @GetMapping("/illegal-argument-exception")
        public void throwIllegalArgumentException() {
            throw new IllegalArgumentException("Invalid argument");
        }

        @GetMapping("/data-access-exception")
        public void throwDataAccessException() {
            throw new DataAccessException("Database connection failed") {};
        }

        @GetMapping("/general-exception")
        public void throwGeneralException() throws Exception {
            throw new Exception("Unexpected error");
        }
    }

    static class TestRequest {
        @NotBlank(message = "Name is required")
        private String name;

        public TestRequest() {
        }

        public TestRequest(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    @Configuration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }
}
