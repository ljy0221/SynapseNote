package com.synapse.api.modules.ws.controller;

import com.synapse.api.modules.ws.dto.request.WsAuthRequest;
import com.synapse.api.modules.ws.dto.response.WsAuthResponse;
import com.synapse.api.modules.ws.service.WsAuthService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class WsAuthController {

    private final WsAuthService wsAuthService;

    @PostMapping("/v1/ws/auth")
    public DataResponse<WsAuthResponse> issueWsTicket(
            @AuthenticationPrincipal CustomUserDetails details,
            @RequestBody WsAuthRequest request
    ) {
        System.out.println("티켓 발행");
        return DataResponse.of(wsAuthService.issueTicket(details.id(), request));
    }

}

