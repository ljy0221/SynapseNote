package com.synapse.api.modules.user.dto.oauth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
public class GithubUserInfo implements OAuthUserInfo {

    @JsonProperty("id")
    private Long providerId;

    @JsonProperty("email")
    @Setter
    private String email;

    @JsonProperty("name")
    private String name;

    @JsonProperty("login")
    private String login;

    @Override
    public String getProviderId() {
        return providerId.toString();
    }

    @Override
    public String getEmail() {
        return email;
    }

    @Override
    public String getName() {
        if (name != null && !name.isBlank()) {
            return name;
        }
        return login;
    }

    @Override
    public OAuthProvider getProvider() {
        return OAuthProvider.GITHUB;
    }
}
