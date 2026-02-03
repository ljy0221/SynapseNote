package com.synapse.api.util.redis;

import com.synapse.api.util.Constant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenRedisService {

    private final RedisUtil redisUtil;
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    // token:refresh:whitelist:UUID = memberId
    public String generateRefreshToken(UUID memberId) {
        String token = makeRandomToken();
        String key = RedisConstant.REFRESH_TOKEN_WHITELIST + token;

        redisUtil.setData(key, memberId.toString(), Constant.REFRESH_EXPIRED);
        return token;
    }

    public boolean isRefreshTokenValid(String token) {
        String key = RedisConstant.REFRESH_TOKEN_WHITELIST + token;
        return redisUtil.exists(key);
    }

    public UUID getMemberFromRefreshToken(String token) {
        String key = RedisConstant.REFRESH_TOKEN_WHITELIST + token;
        return redisUtil.getData(key).map(UUID::fromString).orElse(null);
    }

    public void deleteRefreshToken(String token) {
        String key = RedisConstant.REFRESH_TOKEN_WHITELIST + token;
        redisUtil.deleteData(key);
    }

    // token:access:blacklist::JWT = true
    public void addAccessTokenToBlacklist(String token) {
        String key = RedisConstant.ACCESS_TOKEN_BLACKLIST + token;
        redisUtil.setData(key, true, Constant.ACCESS_EXPIRED);
    }

    public boolean isAccessTokenBlacklisted(String token) {
        String key = RedisConstant.ACCESS_TOKEN_BLACKLIST + token;
        return redisUtil.exists(key);
    }

    private String makeRandomToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

}
