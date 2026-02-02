package com.synapse.api.modules.token.service;

import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.token.dto.response.TokenResult;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.redis.TokenRedisService;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;
    private final TokenRedisService tokenRefreshService;

    public TokenResult refreshToken(UUID memberId, String refreshToken) {

        memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // refresh token 검증
        String storedRefresh = tokenRefreshService.getRefreshToken(memberId);
        if (storedRefresh == null || !storedRefresh.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        // 기존 refresh 삭제
        tokenRefreshService.deleteRefreshToken(memberId);

        String newAccess = jwtUtil.generateAccessToken(memberId);
        String newRefresh = tokenRefreshService.generateRefreshToken(memberId);

        return TokenResult.builder()
                .access(newAccess)
                .refresh(newRefresh)
                .build();
    }

}
