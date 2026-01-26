package com.synapse.api.modules.user.service;

import com.synapse.api.modules.user.dto.oauth.OAuthUserInfo;

public interface OAuthService {
    OAuthUserInfo getUserInfo(String accessToken);
}
