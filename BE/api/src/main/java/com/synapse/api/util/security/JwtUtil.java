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
                .claim("id", id.toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiredMs))
                .signWith(secretKey)
                .compact();
    }

    // id 가져오기
    public UUID getId(String token) {
        String stringId = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().get("id", String.class);
        return UUID.fromString(stringId);
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

