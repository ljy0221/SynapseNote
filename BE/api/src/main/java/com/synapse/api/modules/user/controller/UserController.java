package com.synapse.api.modules.user.controller;

import com.synapse.api.modules.user.dto.request.LoginRequest;
import com.synapse.api.modules.user.dto.response.LoginResponse;
import com.synapse.api.modules.user.dto.response.LoginResult;
import com.synapse.api.modules.user.dto.response.ProfileResponse;
import com.synapse.api.modules.user.service.UserService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
                        .sessionReplaced(result.sessionReplaced())
                        .build()
        );
    }

    @GetMapping("/v1/members/me")
    public DataResponse<ProfileResponse> getProfile(@AuthenticationPrincipal CustomUserDetails details) {
        ProfileResponse profile = userService.getProfile(details.id());
        return DataResponse.of(profile);
    }

    @PostMapping("/v1/logout")
    public StatusResponse logout(@AuthenticationPrincipal CustomUserDetails details) {
        userService.logout(details.id());
        return StatusResponse.of(SuccessCode.ACCEPTED);
    }

    @DeleteMapping("/v1/members")
    public StatusResponse deleteUser(@AuthenticationPrincipal CustomUserDetails details) {
        userService.withdraw(details.id());
        return StatusResponse.of(SuccessCode.NO_CONTENT);
    }

}
