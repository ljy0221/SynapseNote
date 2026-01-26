package com.synapse.api.util.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.util.Constant;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.response.ErrorResponse;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

import static com.synapse.api.util.Constant.AUTHORIZATION_HEADER;

@Slf4j
@RequiredArgsConstructor
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenRedisService tokenRedisService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 건너 뛰어야 하는 경로 건너뛰기
        if (shouldSkip(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Authorization 헤더 찾기
        String authorization = request.getHeader(AUTHORIZATION_HEADER);

        // Authorization 헤더 검증 (Bearer로 시작하는지 검증)
        if (authorization == null || !authorization.startsWith(Constant.BEARER_PREFIX)) {
            log.info("Missing or invalid Authorization header");
            setErrorResponse(request, response, ErrorCode.AUTH_UNAUTHORIZED);
            return;
        }

        // Bearer 접두사 제거 후 순수 토큰 획득
        String token = authorization.split(" ")[1];

        // 토큰 소멸 시간 검증
        try {
            if (jwtUtil.isExpired(token)) {
                log.info("Token is expired");
                setErrorResponse(request, response, ErrorCode.AUTH_UNAUTHORIZED);
                // setBody(response, 401, "Access token expired. Please reissue it.");
                return;
            }
        } catch (MalformedJwtException | SignatureException | UnsupportedJwtException | IllegalArgumentException e) {
            log.info("Invalid token");
            setErrorResponse(request, response, ErrorCode.AUTH_UNAUTHORIZED);
            // setBody(response, 400,"Token form is incorrect");
            return;
        }

        // 파기된 토큰인지 확인
        if (tokenRedisService.isExpired(token)) {
            log.info("Token has been invalidated");
            setErrorResponse(request, response, ErrorCode.AUTH_UNAUTHORIZED);
            // setBody(response, 401, "Access token has been invalidated. Please reissue");
            return;
        }

        // 토큰에서 정보 획득
        UUID id = jwtUtil.getId(token);

        // 매 요청마다 ContextHolder에 Authentication 추가
        CustomUserDetails session = new CustomUserDetails(id);
        Authentication authToken = new UsernamePasswordAuthenticationToken(session, null, session.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);

        // 다음 필터로 넘기기
        filterChain.doFilter(request, response);
    }

    private void setErrorResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            ErrorCode errorCode
    ) throws IOException {

        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse =
                ErrorResponse.of(errorCode, request.getRequestURI());

        response.getWriter().write(this.objectMapper.writeValueAsString(errorResponse));
    }


    private boolean shouldSkip(HttpServletRequest request) {
        String path = request.getRequestURI();
        return (path.startsWith("/api/") && (
                path.matches("^/api/v\\d+/login")
        )) || path.matches(".*\\.(js|css|png|jpg|ico)$");
    }

}