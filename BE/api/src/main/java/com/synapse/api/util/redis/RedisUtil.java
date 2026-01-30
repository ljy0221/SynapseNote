package com.synapse.api.util.redis;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
public class RedisUtil {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisUtil(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();

        // Redis 전용 ObjectMapper 생성
        this.objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
    }

    public Optional<String> getData(String key) {
        ValueOperations<String, String> valueOperations = redisTemplate.opsForValue();
        return Optional.ofNullable(valueOperations.get(key));
    }

    public <T> Optional<T> getData(String key, Class<T> clazz) {
        ValueOperations<String, String> ops = redisTemplate.opsForValue();
        String jsonValue = ops.get(key);
        if (jsonValue == null) return Optional.empty();

        try {
            return Optional.of(objectMapper.readValue(jsonValue, clazz));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize value for key: " + key, e);
        }
    }

    public void setData(String key, String value, long duration) {
        ValueOperations<String, String> valueOperations = redisTemplate.opsForValue();
        Duration expireDuration = Duration.ofSeconds(duration);
        valueOperations.set(key, value, expireDuration);
    }

    public <T> void setData(String key, T value, long duration) {
        try {
            ValueOperations<String, String> ops = redisTemplate.opsForValue();
            String jsonValue = objectMapper.writeValueAsString(value);
            ops.set(key, jsonValue, Duration.ofSeconds(duration));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize value for key: " + key, e);
        }
    }

    public void deleteData(String key) {
        redisTemplate.delete(key);
    }

    public boolean exists(String key) {
        return hasKey(key).orElse(false);
    }

    private Optional<Boolean> hasKey(String key) {
        return Optional.of(redisTemplate.hasKey(key));
    }

    public Long getTTL(String key) {
        return redisTemplate.getExpire(key);
    }

}
