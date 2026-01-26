package com.synapse.api.module.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.naming.AuthenticationException;
import java.nio.file.AccessDeniedException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 커스텀 예외 처리
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(
            BaseException e,
            HttpServletRequest request) {

        log.error("BaseException: code={}, message={}, path={}",
                e.getErrorCode().name(), e.getMessage(), request.getRequestURI(), e);

        ErrorResponse response = ErrorResponse.of(e, request.getRequestURI());

        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(response);
    }

    // Validation 예외 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException e,
            HttpServletRequest request) {

        Map<String, Object> details = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error -> {
            details.put(error.getField(), error.getDefaultMessage());
        });

        log.warn("Validation failed: {}", details);

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.VALIDATION_INVALID_INPUT,
                request.getRequestURI(),
                details
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // 인증 예외 처리
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException e,
            HttpServletRequest request) {

        log.warn("Authentication failed: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.AUTH_UNAUTHORIZED,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }

    // 권한 예외 처리
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException e,
            HttpServletRequest request) {

        log.warn("Access denied: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.AUTH_FORBIDDEN,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    // IllegalArgument 예외 처리
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException e,
            HttpServletRequest request) {

        log.warn("Illegal argument: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.VALIDATION_INVALID_PARAMETER,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // 데이터베이스 예외 처리
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccessException(
            DataAccessException e,
            HttpServletRequest request) {

        log.error("Database error", e);

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.SYSTEM_DATABASE_ERROR,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    // 처리되지 않은 모든 예외
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception e,
            HttpServletRequest request) {

        log.error("Unhandled exception", e);

        ErrorResponse response = ErrorResponse.of(
                ErrorCode.SYSTEM_INTERNAL_ERROR,
                request.getRequestURI()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}