package com.synapse.api.modules.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.user.dto.oauth.GithubEmail;
import com.synapse.api.modules.user.dto.oauth.GithubUserInfo;
import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Arrays;
import java.util.Map;

@Service("githubOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GithubOAuthService implements OAuthService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private final String USERINFO_URL = "https://api.github.com/user";
    private final String EMAILS_URL = "https://api.github.com/user/emails";


    @Override
    public OAuthUserInfo getUserInfo(String accessToken) {
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

}
