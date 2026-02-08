package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.request.MemberRoleUpdateRequest;
import com.synapse.api.modules.note.dto.response.NoteMemberListResponse;
import com.synapse.api.modules.note.dto.response.NoteMemberResponse;
import com.synapse.api.modules.note.service.NoteMemberService;
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
@RequestMapping("/api/v1/notes/{noteId}/members")
@RequiredArgsConstructor
public class NoteMemberController {

    private final NoteMemberService noteMemberService;

    /**
     * 멤버 목록 조회
     * GET /api/v1/notes/{noteId}/members
     */
    @GetMapping
    public DataResponse<NoteMemberListResponse> getMembers(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID memberId = details.id();
        log.info("Getting members for note: {} by member: {}", noteId, memberId);
        NoteMemberListResponse response = noteMemberService.getMembers(noteId, memberId);
        return DataResponse.of(response);
    }

    /**
     * 멤버 권한 변경
     * PATCH /api/v1/notes/{noteId}/members/{memberId}/role
     */
    @PatchMapping("/{memberId}/role")
    public DataResponse<NoteMemberResponse> updateMemberRole(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable UUID memberId,
            @Valid @RequestBody MemberRoleUpdateRequest request) {
        UUID requesterId = details.id();
        log.info("Updating role for member: {} in note: {} by member: {}", memberId, noteId, requesterId);
        NoteMemberResponse response = noteMemberService.updateMemberRole(noteId, memberId, requesterId, request);
        return DataResponse.of(response);
    }

    /**
     * 멤버 삭제
     * DELETE /api/v1/notes/{noteId}/members/{memberId}
     */
    @DeleteMapping("/{memberId}")
    public DataResponse<Void> removeMember(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable UUID memberId) {
        UUID requesterId = details.id();
        log.info("Removing member: {} from note: {} by member: {}", memberId, noteId, requesterId);
        noteMemberService.removeMember(noteId, memberId, requesterId);
        return DataResponse.of(SuccessCode.NO_CONTENT, null);
    }
}
