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
        String key = RedisConstant.REDIS_REFRESH_TOKEN + id.toString();
        redisUtil.setData(key, token, Constant.REFRESH_EXPIRED);

        return token;
    }

    public String getRefreshToken(UUID id) {
        String key = RedisConstant.REDIS_REFRESH_TOKEN + id.toString();
        return redisUtil.getData(key).orElse(null);
    }

    public void deleteRefreshToken(UUID id) {
        String key = RedisConstant.REDIS_REFRESH_TOKEN + id.toString();
        redisUtil.deleteData(key);
    }

    public void addBlacklist(String token) {
        String key = RedisConstant.REDIS_TOKEN_EXPIRED + token;
        redisUtil.setData(key, token, Constant.ACCESS_EXPIRED);
    }

    public boolean isBlacklisted(String token) {
        String key = RedisConstant.REDIS_TOKEN_EXPIRED + token;
        return redisUtil.exists(key);
    }

    private String makeRandomToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

}
