package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.GithubEmail;
import com.synapse.api.modules.member.dto.oauth.GithubTokenResponse;
import com.synapse.api.modules.member.dto.oauth.GithubUserInfo;
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

import java.util.Arrays;
import java.util.Map;

@Service("githubOAuthService")
@RequiredArgsConstructor
@Slf4j
public class GithubOAuthService implements OAuthService {

    private final RestClient restClient;

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.client.secret}")
    private String clientSecret;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    @Value("${github.web.client.id}")
    private String webClientId;

    @Value("${github.web.client.secret}")
    private String webClientSecret;

    @Value("${github.web.redirect.uri}")
    private String webRedirectUri;

    private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String USERINFO_URL = "https://api.github.com/user";
    private static final String EMAILS_URL = "https://api.github.com/user/emails";

    @Override
    public OAuthUserInfo getUserInfo(String authorizationCode, String platform) {
        String accessToken = exchangeAccessToken(authorizationCode, platform);

        GithubUserInfo userInfo = fetchUserInfo(accessToken);

        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            userInfo.setEmail(fetchEmail(accessToken));
        }

        return userInfo;
    }

    private GithubUserInfo fetchUserInfo(String accessToken) {
        try {
            GithubUserInfo userInfo = restClient.get()
                    .uri(USERINFO_URL)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .body(GithubUserInfo.class);

            if (userInfo == null) {
                throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR,
                        Map.of("reason", "GitHub userinfo response body is null"));
            }

            log.info("GitHub UserInfo OK: providerId={}, email={}, name={}, login={}",
                    userInfo.getProviderId(), userInfo.getEmail(), userInfo.getName(), userInfo.getLogin());

            return userInfo;

        } catch (HttpStatusCodeException e) {
            log.error("GitHub UserInfo 요청 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of(
                    "status", e.getStatusCode().value(),
                    "body", e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            log.error("GitHub UserInfo 네트워크 오류", e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of("message", e.getMessage()));
        }
    }

    private String fetchEmail(String accessToken) {
        try {
            GithubEmail[] emails = restClient.get()
                    .uri(EMAILS_URL)
                    .headers(h -> h.setBearerAuth(accessToken))
                    .retrieve()
                    .body(GithubEmail[].class);

            if (emails == null || emails.length == 0) {
                throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR,
                        Map.of("reason", "No emails returned from GitHub"));
            }

            return Arrays.stream(emails)
                    .filter(GithubEmail::primary)
                    .filter(GithubEmail::verified)
                    .map(GithubEmail::email)
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(
                            ErrorCode.OAUTH_PROVIDER_ERROR,
                            Map.of("reason", "No primary verified email")));

        } catch (HttpStatusCodeException e) {
            log.error("GitHub Emails 요청 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of(
                    "status", e.getStatusCode().value(),
                    "body", e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            log.error("GitHub Emails 네트워크 오류", e);
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_ERROR, Map.of("message", e.getMessage()));
        }
    }

    private String exchangeAccessToken(String authorizationCode, String platform) {
        boolean isWeb = "WEB".equalsIgnoreCase(platform);
        String currentClientId = isWeb ? webClientId : clientId;
        String currentClientSecret = isWeb ? webClientSecret : clientSecret;
        String currentRedirectUri = isWeb ? webRedirectUri : redirectUri;

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", currentClientId);
        form.add("client_secret", currentClientSecret);
        form.add("code", authorizationCode);
        form.add("redirect_uri", currentRedirectUri);

        try {
            GithubTokenResponse tokenResponse = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(GithubTokenResponse.class);

            if (tokenResponse == null || tokenResponse.accessToken() == null || tokenResponse.accessToken().isBlank()) {
                log.warn("GitHub token 응답이 비정상: tokenResponse={}", tokenResponse);
                throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE);
            }

            return tokenResponse.accessToken();

        } catch (HttpStatusCodeException e) {
            log.error("GitHub Token 요청 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE, Map.of(
                    "status", e.getStatusCode().value(),
                    "body", e.getResponseBodyAsString()));
        } catch (ResourceAccessException e) {
            log.error("GitHub Token 네트워크 오류", e);
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_ISSUE, Map.of("message", e.getMessage()));
        }
    }
}
