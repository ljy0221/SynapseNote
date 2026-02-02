package com.synapse.api.modules.token.controller;

import com.synapse.api.modules.token.dto.response.AccessTokenResponse;
import com.synapse.api.modules.token.dto.response.TokenResult;
import com.synapse.api.modules.token.service.TokenService;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Arrays;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TokenController {

    private final TokenService tokenService;

    @PostMapping("/v1/refresh")
    public DataResponse<AccessTokenResponse> refreshToken(@AuthenticationPrincipal CustomMemberDetails details,
                                    HttpServletRequest request,
                                    HttpServletResponse response) {
        String refresh = extractRefreshToken(request);
        TokenResult result = tokenService.refreshToken(details.id(), refresh);

        System.out.println(details.id());
        System.out.println(refresh);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refresh())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(14))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        AccessTokenResponse responseDto = AccessTokenResponse.builder()
                .accessToken(result.access())
                .build();

        return DataResponse.of(responseDto);
    }

    private String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_REFRESH);
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> "refreshToken".equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_REFRESH));
    }



}
