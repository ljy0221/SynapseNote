package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.GoogleTokenResponse;
import com.synapse.api.modules.member.dto.oauth.GoogleUserInfo;
import com.synapse.api.modules.member.dto.oauth.OAuthUserInfo;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service("googleOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthService implements OAuthService {

    private final RestClient restClient;

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

    @Override
    public OAuthUserInfo getUserInfo(String authorizationCode) {
        String accessToken = exchangeAccessToken(authorizationCode);

        try {
            GoogleUserInfo userInfo = restClient.get()
                    .uri(USERINFO_URL)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .body(GoogleUserInfo.class);

            if (userInfo == null) {
                throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR);
            }

            log.info("Google UserInfo OK: providerId={}, email={}", userInfo.getProviderId(), userInfo.getEmail());
            return userInfo;

        } catch (HttpStatusCodeException e) {
            log.error("Google UserInfo 요청 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of(
                    "status", e.getStatusCode().value(),
                    "body", e.getResponseBodyAsString()
            ));
        } catch (ResourceAccessException e) {
            log.error("Google UserInfo 네트워크 오류", e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of("message", e.getMessage()));
        }
    }

    private String exchangeAccessToken(String authorizationCode) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", authorizationCode);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        try {
            GoogleTokenResponse tokenResponse = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(GoogleTokenResponse.class);

            if (tokenResponse == null || tokenResponse.accessToken() == null || tokenResponse.accessToken().isBlank()) {
                log.warn("Google token 응답이 비정상: tokenResponse={}", tokenResponse);
                throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE);
            }

            return tokenResponse.accessToken();

        } catch (HttpStatusCodeException e) {
            log.error("Google Token 요청 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE, Map.of(
                    "status", e.getStatusCode().value(),
                    "body", e.getResponseBodyAsString()
            ));
        } catch (ResourceAccessException e) {
            log.error("Google Token 네트워크 오류", e);
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE, Map.of("message", e.getMessage()));
        }
    }
}
