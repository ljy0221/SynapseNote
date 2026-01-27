package com.synapse.api.modules.user.controller;

import com.synapse.api.modules.user.dto.request.LoginRequest;
import com.synapse.api.modules.user.dto.response.LoginResponse;
import com.synapse.api.modules.user.dto.response.LoginResult;
import com.synapse.api.modules.user.service.UserService;
import com.synapse.api.util.response.DataResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    @PostMapping("/v1/login")
    public DataResponse<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult result = userService.login(request);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(14))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return DataResponse.of(
                LoginResponse.builder()
                        .accessToken(result.accessToken())
                        .build()
        );
    }

}
