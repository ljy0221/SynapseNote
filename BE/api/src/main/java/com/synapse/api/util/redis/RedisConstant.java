package com.synapse.api.util.redis;

public class RedisConstant {

    private RedisConstant() {}

    // 토큰 만료 여부에 대한 key
    public static final String REDIS_TOKEN_EXPIRED = "token:expired:";  // token:expired:{token} = true
    public static final String REDIS_TOKEN_USED = "token:used:";  // token:used:{token} = true

    // 회원에 대한 Refresh Token
    public static final String REDIS_REFRESH_TOKEN = "token:refresh:";  //token:refresh:{role}:{userId} = {refreshToken}

}
