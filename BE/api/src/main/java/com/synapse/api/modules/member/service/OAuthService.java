package com.synapse.api.modules.member.service;

import com.synapse.api.modules.member.dto.oauth.OAuthUserInfo;

public interface OAuthService {
    OAuthUserInfo getUserInfo(String authorizationCode, String platform);
}
