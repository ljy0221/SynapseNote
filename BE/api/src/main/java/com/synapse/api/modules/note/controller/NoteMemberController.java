package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.request.MemberRoleUpdateRequest;
import com.synapse.api.modules.note.dto.response.NoteMemberListResponse;
import com.synapse.api.modules.note.dto.response.NoteMemberResponse;
import com.synapse.api.modules.note.service.NoteMemberService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomUserDetails;
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
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        log.info("Getting members for note: {} by user: {}", noteId, userId);
        NoteMemberListResponse response = noteMemberService.getMembers(noteId, userId);
        return DataResponse.of(response);
    }

    /**
     * 멤버 권한 변경
     * PATCH /api/v1/notes/{noteId}/members/{userId}/role
     */
    @PatchMapping("/{userId}/role")
    public DataResponse<NoteMemberResponse> updateMemberRole(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @PathVariable UUID userId,
            @Valid @RequestBody MemberRoleUpdateRequest request) {
        UUID requesterId = details.id();
        log.info("Updating role for user: {} in note: {} by user: {}", userId, noteId, requesterId);
        NoteMemberResponse response = noteMemberService.updateMemberRole(noteId, userId, requesterId, request);
        return DataResponse.of(response);
    }

    /**
     * 멤버 삭제
     * DELETE /api/v1/notes/{noteId}/members/{userId}
     */
    @DeleteMapping("/{userId}")
    public DataResponse<Void> removeMember(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @PathVariable UUID userId) {
        UUID requesterId = details.id();
        log.info("Removing user: {} from note: {} by user: {}", userId, noteId, requesterId);
        noteMemberService.removeMember(noteId, userId, requesterId);
        return DataResponse.of(SuccessCode.NO_CONTENT, null);
    }
}
