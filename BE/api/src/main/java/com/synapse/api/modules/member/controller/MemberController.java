package com.synapse.api.modules.member.controller;

import com.synapse.api.modules.member.dto.request.LoginRequest;
import com.synapse.api.modules.member.dto.request.UpdateNicknameRequest;
import com.synapse.api.modules.member.dto.response.LoginResponse;
import com.synapse.api.modules.member.dto.response.LoginResult;
import com.synapse.api.modules.member.dto.response.ProfileResponse;
import com.synapse.api.modules.member.service.MemberService;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

import static com.synapse.api.util.Constant.AUTHORIZATION_HEADER;
import static com.synapse.api.util.Constant.BEARER_PREFIX;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MemberController {

    private final MemberService memberService;

    @PostMapping("/v1/login")
    public DataResponse<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult result = memberService.login(request);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(14))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return DataResponse.of(result.response());
    }

    @GetMapping("/v1/members/me")
    public DataResponse<ProfileResponse> getProfile(@AuthenticationPrincipal CustomMemberDetails details) {
        ProfileResponse profile = memberService.getProfile(details.id());
        return DataResponse.of(profile);
    }

    @PostMapping("/v1/logout")
    public StatusResponse logout(HttpServletRequest request,
                                 @AuthenticationPrincipal CustomMemberDetails details) {
        memberService.logout(details.id(), extractAccessToken(request));
        return StatusResponse.of(SuccessCode.ACCEPTED);
    }

    @DeleteMapping("/v1/members")
    public StatusResponse deleteMember(HttpServletRequest request,
                                     @AuthenticationPrincipal CustomMemberDetails details) {
        memberService.withdraw(details.id(), extractAccessToken(request));
        return StatusResponse.of(SuccessCode.NO_CONTENT);
    }

    @PatchMapping("/v1/members/me")
    public DataResponse<ProfileResponse> updateNickname(
            @RequestBody @Valid UpdateNicknameRequest request,
            @AuthenticationPrincipal CustomMemberDetails details) {
        ProfileResponse updatedProfile = memberService.updateNickname(details.id(), request.name());
        return DataResponse.of(updatedProfile);
    }

    private String extractAccessToken(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);

        if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
            throw new BusinessException(ErrorCode.HEADER_INVALID);
        }

        return authorization.substring(7);
    }

}
