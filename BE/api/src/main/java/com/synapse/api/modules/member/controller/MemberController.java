package com.synapse.api.modules.member.controller;

import com.synapse.api.modules.member.dto.request.LoginRequest;
import com.synapse.api.modules.member.dto.request.UpdateNicknameRequest;
import com.synapse.api.modules.member.dto.request.UpdateThemeRequest;
import com.synapse.api.modules.member.dto.response.LoginResponse;
import com.synapse.api.modules.member.dto.response.LoginResult;
import com.synapse.api.modules.member.dto.response.ProfileResponse;
import com.synapse.api.modules.member.dto.response.StreakResponse;
import com.synapse.api.modules.member.service.MemberService;
import com.synapse.api.modules.token.service.TokenService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class MemberController {

    private final MemberService memberService;
    private final TokenService tokenService;

    @PostMapping("/v1/login")
    public DataResponse<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult result = memberService.login(request);

        tokenService.addRefreshTokenToCookie(response, result.refreshToken());

        return DataResponse.of(result.response());
    }

    @GetMapping("/v1/members/me")
    public DataResponse<ProfileResponse> getProfile(@AuthenticationPrincipal CustomMemberDetails details) {
        ProfileResponse profile = memberService.getProfile(details.id());
        return DataResponse.of(profile);
    }

    @PostMapping("/v1/logout")
    public StatusResponse logout(HttpServletRequest request) {
        String accessToken = tokenService.extractAccessToken(request);
        String refreshToken = tokenService.extractRefreshToken(request);

        memberService.logout(accessToken, refreshToken);

        return StatusResponse.of(SuccessCode.ACCEPTED);
    }

    @DeleteMapping("/v1/members")
    public StatusResponse deleteMember(HttpServletRequest request,
                                       @AuthenticationPrincipal CustomMemberDetails details) {
        String accessToken = tokenService.extractAccessToken(request);
        String refreshToken = tokenService.extractRefreshToken(request);

        memberService.withdraw(details.id(), accessToken, refreshToken);
        return StatusResponse.of(SuccessCode.NO_CONTENT);
    }

    @PatchMapping("/v1/members/me")
    public DataResponse<ProfileResponse> updateNickname(
            @RequestBody @Valid UpdateNicknameRequest request,
            @AuthenticationPrincipal CustomMemberDetails details) {
        ProfileResponse updatedProfile = memberService.updateNickname(details.id(), request.name());
        return DataResponse.of(updatedProfile);
    }

    @PatchMapping("/v1/members/me/theme")
    public DataResponse<ProfileResponse> updateTheme(
            @RequestBody @Valid UpdateThemeRequest request,
            @AuthenticationPrincipal CustomMemberDetails details) {
        ProfileResponse updatedProfile = memberService.updateTheme(details.id(), request);
        return DataResponse.of(updatedProfile);
    }

    @GetMapping("/v1/members/{memberId}/streak")
    public DataResponse<List<StreakResponse>> getStreak(
            @PathVariable UUID memberId) {
        return DataResponse.of(memberService.getStreak(memberId));
    }

}
