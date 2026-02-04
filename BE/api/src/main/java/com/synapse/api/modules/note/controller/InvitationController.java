package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.request.InvitationCreateRequest;
import com.synapse.api.modules.note.dto.response.InvitationAcceptResponse;
import com.synapse.api.modules.note.dto.response.InvitationListResponse;
import com.synapse.api.modules.note.dto.response.InvitationResponse;
import com.synapse.api.modules.note.service.InvitationService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    /**
     * 초대 생성
     * POST /api/v1/notes/{noteId}/invitations
     */
    @PostMapping("/v1/notes/{noteId}/invitations")
    public DataResponse<InvitationResponse> createInvitation(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @Valid @RequestBody InvitationCreateRequest request) {
        UUID userId = details.id();
        log.info("Creating invitation for note: {} by user: {}", noteId, userId);
        InvitationResponse response = invitationService.createInvitation(noteId, userId, request);
        return DataResponse.of(SuccessCode.CREATED, response);
    }

    /**
     * 초대 수락
     * POST /api/v1/notes/invitations/{token}/accept
     */
    @PostMapping("/v1/notes/invitations/{token}/accept")
    public DataResponse<InvitationAcceptResponse> acceptInvitation(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID token) {
        UUID userId = details.id();
        log.info("User: {} accepting invitation with token: {}", userId, token);
        InvitationAcceptResponse response = invitationService.acceptInvitation(token, userId);
        return DataResponse.of(response);
    }

    /**
     * 초대 링크를 통한 가입 요청
     * POST /api/v1/notes/invitations/{token}/request
     */
    @PostMapping("/v1/notes/invitations/{token}/request")
    public DataResponse<Void> requestJoin(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID token) {
        UUID userId = details.id();
        log.info("User: {} requesting to join via token: {}", userId, token);
        invitationService.requestJoin(token, userId);
        return DataResponse.of(SuccessCode.CREATED, null);
    }

    /**
     * 가입 요청 승인
     * POST /api/v1/notes/invitations/{invitationId}/approve
     */
    @PostMapping("/v1/notes/invitations/{invitationId}/approve")
    public DataResponse<Void> approveJoin(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID invitationId) {
        UUID ownerId = details.id();
        log.info("Owner: {} approving invitation: {}", ownerId, invitationId);
        invitationService.approveJoin(invitationId, ownerId);
        return DataResponse.of(SuccessCode.SUCCESS, null);
    }

    /**
     * PENDING 초대 목록 조회
     * GET /api/v1/notes/{noteId}/invitations
     */
    @GetMapping("/v1/notes/{noteId}/invitations")
    public DataResponse<InvitationListResponse> getPendingInvitations(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        log.info("Getting pending invitations for note: {} by user: {}", noteId, userId);
        InvitationListResponse response = invitationService.getPendingInvitations(noteId, userId);
        return DataResponse.of(response);
    }
}
