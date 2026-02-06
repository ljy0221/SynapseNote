package com.synapse.api.modules.token.service;

import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.token.dto.response.TokenResult;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.UUID;

import static com.synapse.api.util.Constant.*;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;
    private final TokenRedisService tokenRedisService;

    public TokenResult refreshToken(String refreshToken) {
        if (!tokenRedisService.isRefreshTokenValid(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        UUID memberId = tokenRedisService.getMemberFromRefreshToken(refreshToken);
        if (memberId == null || !memberRepository.existsById(memberId)) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        String newAccessToken = jwtUtil.generateAccessToken(memberId);
        String newRefreshToken = tokenRedisService.generateRefreshToken(memberId);

        return TokenResult.builder()
                .access(newAccessToken)
                .refresh(newRefreshToken)
                .build();
    }

    public String extractAccessToken(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);

        if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
            throw new BusinessException(ErrorCode.HEADER_INVALID);
        }

        return authorization.substring(7);
    }

    public String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_REFRESH);
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_COOKIE_NAME.equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_REFRESH));
    }

    public void addRefreshTokenToCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(REFRESH_COOKIE_DURATION)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

}
