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
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (shouldSkip(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorization = request.getHeader(AUTHORIZATION_HEADER);

        if (authorization == null || !authorization.startsWith(Constant.BEARER_PREFIX)) {
            log.info("Missing or invalid Authorization header");
            setErrorResponse(request, response, ErrorCode.HEADER_INVALID);
            return;
        }

        String token = authorization.substring(Constant.BEARER_PREFIX.length()).trim();

        try {
            if (jwtUtil.isExpired(token)) {
                log.info("Token is expired");
                setErrorResponse(request, response, ErrorCode.TOKEN_EXPIRED);
                return;
            }

            if (tokenRedisService.isAccessTokenBlacklisted(token)) {
                log.info("Token is blacklisted");
                setErrorResponse(request, response, ErrorCode.TOKEN_EXPIRED);
                return;
            }

        } catch (MalformedJwtException | SignatureException | UnsupportedJwtException | IllegalArgumentException e) {
            log.info("Invalid token");
            setErrorResponse(request, response, ErrorCode.TOKEN_INVALID);
            return;
        }

        UUID id = jwtUtil.getId(token);

        CustomMemberDetails session = new CustomMemberDetails(id);
        Authentication authToken = new UsernamePasswordAuthenticationToken(session, null, session.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    private void setErrorResponse(
            HttpServletRequest request,
            HttpServletResponse response,
            ErrorCode errorCode) throws IOException {

        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponse errorResponse = ErrorResponse.of(errorCode, request.getRequestURI());

        response.getWriter().write(this.objectMapper.writeValueAsString(errorResponse));
    }

    private boolean shouldSkip(HttpServletRequest request) {
        String path = request.getRequestURI();
        return (path.startsWith("/api/") && (path.matches("^/api/v\\d+/login")
                || path.matches("^/api/v\\d+/refresh"))) || path.matches(".*\\.(js|css|png|jpg|ico)$")
                || path.startsWith("/webrtc")
                || path.matches("^/test/.*");
    }

}