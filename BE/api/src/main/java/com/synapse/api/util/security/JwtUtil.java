package com.synapse.api.util.security;

import com.synapse.api.util.Constant;
import com.synapse.api.util.redis.TokenRedisService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final TokenRedisService tokenRedisService;

    // secret key 가져오기
    public JwtUtil(@Value("${spring.jwt.secret}") String secret, TokenRedisService tokenRedisService) {
        this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), Jwts.SIG.HS256.key().build().getAlgorithm());
        this.tokenRedisService = tokenRedisService;
    }

    // Access Token 토큰 발급
    public String generateAccessToken(UUID id) {
        long expiredMs = Constant.ACCESS_EXPIRED * 1000;
        return Jwts.builder()
                .claim("id", id)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(secretKey)
                .compact();
    }

    // 토큰 파기
    public void expireToken(String token) {
        long issuedAt = getIssuedAt(token);
        Date now = new Date();

        long remainingTime = (Constant.ACCESS_EXPIRED - (now.getTime() - issuedAt)/1000);
        if (remainingTime > 0) {
            tokenRedisService.expireToken(token, remainingTime);
        }
    }

    // id 가져오기
    public UUID getId(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().get("id", UUID.class);
    }

    // 발행시간 가져오기
    public long getIssuedAt(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().getIssuedAt().getTime();
    }

    // 토큰 만료 확인
    public boolean isExpired(String token) throws MalformedJwtException {
        try {
            return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

}

