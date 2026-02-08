package com.synapse.api.util.exception;

import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.naming.AuthenticationException;
import java.nio.file.AccessDeniedException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        @ExceptionHandler(BaseException.class)
        public ResponseEntity<ErrorResponse> handleBaseException(
                        BaseException e,
                        HttpServletRequest request) {

                log.error("BaseException: code={}, message={}, path={}",
                                e.getErrorCode().name(), e.getMessage(), request.getRequestURI(), e);

                return ResponseEntity
                                .status(e.getErrorCode().getHttpStatus())
                                .body(ErrorResponse.of(e.getErrorCode()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationException(
                        MethodArgumentNotValidException e,
                        HttpServletRequest request) {

                Map<String, Object> details = new HashMap<>();
                e.getBindingResult().getFieldErrors().forEach(error -> {
                        details.put(error.getField(), error.getDefaultMessage());
                });

                log.warn("Validation failed: {}", details);

                ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ErrorResponse> handleAuthenticationException(
                        AuthenticationException e,
                        HttpServletRequest request) {

                log.warn("Authentication failed: {}", e.getMessage());

                ErrorResponse response = ErrorResponse.of(ErrorCode.AUTH_UNAUTHORIZED);

                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(response);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDeniedException(
                        AccessDeniedException e,
                        HttpServletRequest request) {

                log.warn("Access denied: {}", e.getMessage());

                ErrorResponse response = ErrorResponse.of(ErrorCode.AUTH_FORBIDDEN);

                return ResponseEntity
                                .status(HttpStatus.FORBIDDEN)
                                .body(response);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
                        IllegalArgumentException e,
                        HttpServletRequest request) {

                log.warn("Illegal argument: {}", e.getMessage());

                ErrorResponse response = ErrorResponse.of(ErrorCode.VALIDATION_INVALID_PARAMETER);

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }

        @ExceptionHandler(DataAccessException.class)
        public ResponseEntity<ErrorResponse> handleDataAccessException(
                        DataAccessException e,
                        HttpServletRequest request) {

                log.error("Database error", e);

                ErrorResponse response = ErrorResponse.of(ErrorCode.SYSTEM_DATABASE_ERROR);

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
                        HttpMessageNotReadableException e,
                        HttpServletRequest request) {
                Throwable t = e;
                while (t != null) {
                        if (t instanceof BaseException be) {
                                log.debug("Deserialization failed with BaseException: code={}, path={}",
                                                be.getErrorCode().name(), request.getRequestURI(), e);

                                return ResponseEntity
                                                .status(be.getErrorCode().getHttpStatus())
                                                .body(ErrorResponse.of(be.getErrorCode()));
                        }
                        t = t.getCause();
                }

                log.debug("HttpMessageNotReadable: {}", Objects.requireNonNull(e).getMessage());
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleException(
                        Exception e,
                        HttpServletRequest request) {

                log.error("Unhandled exception", e);

                ErrorResponse response = ErrorResponse.of(ErrorCode.SYSTEM_INTERNAL_ERROR);

                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }
}