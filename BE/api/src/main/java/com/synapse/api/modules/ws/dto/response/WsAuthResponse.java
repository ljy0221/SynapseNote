package com.synapse.api.modules.ws.dto.response;

import lombok.Builder;

@Builder
public record WsAuthResponse(
        String ticket
) {
}
