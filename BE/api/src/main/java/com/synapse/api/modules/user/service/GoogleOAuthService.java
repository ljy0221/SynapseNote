package com.synapse.api.modules.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.user.dto.oauth.GoogleTokenResponse;
import com.synapse.api.modules.user.dto.oauth.GoogleUserInfo;
import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.Objects;

@Service("googleOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthService implements OAuthService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    private final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private final String USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";


    @Override
    public OAuthUserInfo getUserInfo(String authorizationCode) {
        String accessToken = exchangeAccessToken(authorizationCode);

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

    private String exchangeAccessToken(String authorizationCode) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", authorizationCode);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        return Objects.requireNonNull(restClient.post()
                        .uri(TOKEN_URL)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(GoogleTokenResponse.class))
                .accessToken();
    }

}
