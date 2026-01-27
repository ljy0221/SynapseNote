package com.synapse.api.modules.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.user.dto.oauth.GoogleUserInfo;
import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service("googleOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthService implements OAuthService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private final String USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";


    @Override
    public OAuthUserInfo getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        ResponseEntity<String> response;
        try {
            response = restClient.get()
                    .uri(USERINFO_URL)
                    .headers(h -> h.addAll(headers))
                    .retrieve()
                    .toEntity(String.class);

        } catch (Exception e) {
            log.error("UserInfo 요청 중 예외 발생", e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR,
                    Map.of("message", e));
        }

        log.debug("UserInfo 응답 Body: {}", response.getBody());

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR);
        }

        try {
            GoogleUserInfo userInfo =
                    objectMapper.readValue(response.getBody(), GoogleUserInfo.class);
            log.info("UserInfo 파싱 성공: providerId={}, email={}",
                    userInfo.getProviderId(), userInfo.getEmail());
            return userInfo;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARSING_ERROR);
        }
    }
}
