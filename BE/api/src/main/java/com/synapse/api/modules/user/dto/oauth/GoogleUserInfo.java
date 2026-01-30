package com.synapse.api.modules.user.dto.oauth;

import lombok.AllArgsConstructor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleUserInfo implements OAuthUserInfo {

    @JsonProperty("sub")
    private String providerId;

    private String email;

    private String name;

    @Override
    public String getProviderId() { return providerId; }

    @Override
    public String getEmail() { return email; }

    @Override
    public String getName() { return name; }

    @Override
    public OAuthProvider getProvider() { return OAuthProvider.GOOGLE; }
}


