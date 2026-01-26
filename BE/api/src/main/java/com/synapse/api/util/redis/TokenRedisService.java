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
    private static final SecureRandom secureRandom = new SecureRandom(); // thread-safe
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();


    public String generateRefreshToken(UUID id) {
        String token = makeRandomToken();
        String key = RedisConstant.REDIS_REFRESH_TOKEN + token;
        redisUtil.setData(key, id, Constant.REFRESH_EXPIRED);

        return token;
    }

    public String getRefreshToken(String token) {
        String key = RedisConstant.REDIS_REFRESH_TOKEN + token;
        return redisUtil.getData(key).orElse("none");
    }

    public void deleteToken(String token) {
        String key = RedisConstant.REDIS_REFRESH_TOKEN + token;
        redisUtil.deleteData(key);
    }

    public boolean isExpired(String token) {
        return redisUtil
                .getData(RedisConstant.REDIS_TOKEN_EXPIRED + token, Boolean.class)
                .orElse(false);
    }

    public void expireToken(String token, long duration) {
        redisUtil.setData(RedisConstant.REDIS_TOKEN_EXPIRED + token, true, duration);
    }

    public Long getRemainingTime(String token) {
        return redisUtil.getTTL(RedisConstant.REDIS_REFRESH_TOKEN + token);
    }

    public boolean isUsed(String refreshToken) {
        return redisUtil.exists(RedisConstant.REDIS_TOKEN_USED + refreshToken);
    }

    private String makeRandomToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

}
