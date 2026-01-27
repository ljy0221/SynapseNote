package com.synapse.api.modules.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.user.dto.oauth.*;
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

import java.util.Arrays;
import java.util.Map;
import java.util.Objects;

@Service("githubOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GithubOAuthService implements OAuthService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.client.secret}")
    private String clientSecret;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    private final String TOKEN_URL = "https://github.com/login/oauth/access_token";

    private final String USERINFO_URL = "https://api.github.com/user";
    private final String EMAILS_URL = "https://api.github.com/user/emails";


    @Override
    public OAuthUserInfo getUserInfo(String authorizationCode) {
        String accessToken = exchangeAccessToken(authorizationCode);

        ResponseEntity<String> response = getResponse(accessToken);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR);
        }

        GithubUserInfo userInfo = parseUserInfo(response);

        if (userInfo.getEmail() == null) {
            userInfo.setEmail(getEmailFromResourceServer(accessToken));
        }

        return userInfo;
    }

    private ResponseEntity<String> getResponse(String accessToken) {
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
        return response;
    }

    private GithubUserInfo parseUserInfo(ResponseEntity<String> response) {
        try {
            GithubUserInfo userInfo =
                    objectMapper.readValue(response.getBody(), GithubUserInfo.class);
            log.info("UserInfo 파싱 성공: providerId={}, email={}, name={}, login={}",
                    userInfo.getProviderId(), userInfo.getEmail(), userInfo.getName(), userInfo.getLogin());
            return userInfo;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARSING_ERROR);
        }
    }

    private String getEmailFromResourceServer(String accessToken) {
        try {
            ResponseEntity<String> response = restClient.get()
                    .uri(EMAILS_URL)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .toEntity(String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR);
            }

            GithubEmail[] emails =
                    objectMapper.readValue(response.getBody(), GithubEmail[].class);

            return Arrays.stream(emails)
                    .filter(GithubEmail::primary)
                    .filter(GithubEmail::verified)
                    .map(GithubEmail::email)
                    .findFirst()
                    .orElseThrow(() ->
                            new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR,
                                    Map.of("reason", "No primary verified email")));

        } catch (Exception e) {
            log.error("GitHub email 조회 실패", e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR);
        }
    }

    public String exchangeAccessToken(String authorizationCode) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("code", authorizationCode);
        form.add("redirect_uri", redirectUri);

        String accessToken = Objects.requireNonNull(restClient.post()
                        .uri(TOKEN_URL)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(form)
                        .retrieve()
                        .body(GithubTokenResponse.class))
                .accessToken();

        if (accessToken == null) {
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE);
        }

        return accessToken;
    }

}
