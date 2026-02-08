package com.synapse.api.modules.token.controller;

import com.synapse.api.modules.token.dto.response.AccessTokenResponse;
import com.synapse.api.modules.token.dto.response.TokenResult;
import com.synapse.api.modules.token.service.TokenService;
import com.synapse.api.util.response.DataResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TokenController {

    private final TokenService tokenService;

    @PostMapping("/v1/refresh")
    public DataResponse<AccessTokenResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refresh = tokenService.extractRefreshToken(request);
        TokenResult result = tokenService.refreshToken(refresh);

        tokenService.addRefreshTokenToCookie(response, refresh);

        AccessTokenResponse responseDto = AccessTokenResponse.builder()
                .accessToken(result.access())
                .build();

        return DataResponse.of(responseDto);
    }

}
