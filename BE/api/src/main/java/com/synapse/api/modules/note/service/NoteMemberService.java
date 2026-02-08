package com.synapse.api.modules.note.service;

import com.synapse.api.modules.note.dto.request.MemberRoleUpdateRequest;
import com.synapse.api.modules.note.dto.response.NoteMemberListResponse;
import com.synapse.api.modules.note.dto.response.NoteMemberResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteMemberService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;

    /**
     * 멤버 목록 조회
     * - 노트 접근 권한 있는 사용자만 가능
     */
    public NoteMemberListResponse getMembers(UUID noteId, UUID memberId) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. 접근 권한 확인
        validateAccess(note, memberId);

        // 3. 멤버 목록 조회
        List<NoteMember> members = noteMemberRepository.findByNoteId(noteId);

        // 4. DTO 변환
        List<NoteMemberResponse> memberResponses = members.stream()
                .map(NoteMemberResponse::from)
                .toList();

        log.info("Retrieved {} members for note: {} by member: {}", members.size(), noteId, memberId);

        return NoteMemberListResponse.from(memberResponses);
    }

    /**
     * 멤버 권한 변경
     * - OWNER만 가능
     * - 자기 자신의 권한은 변경 불가
     */
    @Transactional
    public NoteMemberResponse updateMemberRole(UUID noteId, UUID targetMemberId, UUID requesterId, MemberRoleUpdateRequest request) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. OWNER 권한 확인
        validateOwnership(note, requesterId);

        // 3. 자기 자신의 권한 변경 불가
        if (requesterId.equals(targetMemberId)) {
            throw new BusinessException(ErrorCode.CANNOT_CHANGE_OWN_ROLE);
        }

        // 4. 대상 멤버 조회
        NoteMember targetMember = noteMemberRepository.findByNoteIdAndMemberId(noteId, targetMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_MEMBER_NOT_FOUND));

        // 5. 권한 변경 (Dirty Checking)
        targetMember.changeRole(request.role());

        log.info("Updated member role for member: {} in note: {} to {} by member: {}",
                targetMemberId, noteId, request.role(), requesterId);

        return NoteMemberResponse.from(targetMember);
    }

    /**
     * 멤버 삭제
     * - OWNER만 가능
     * - 자기 자신은 삭제 불가
     */
    @Transactional
    public void removeMember(UUID noteId, UUID targetMemberId, UUID requesterId) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. OWNER 권한 확인
        validateOwnership(note, requesterId);

        // 3. 자기 자신 삭제 불가
        if (requesterId.equals(targetMemberId)) {
            throw new BusinessException(ErrorCode.CANNOT_REMOVE_SELF);
        }

        // 4. 대상 멤버 조회
        NoteMember targetMember = noteMemberRepository.findByNoteIdAndMemberId(noteId, targetMemberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_MEMBER_NOT_FOUND));

        // 5. Soft Delete
        targetMember.delete();

        log.info("Removed member: {} from note: {} by member: {}", targetMemberId, noteId, requesterId);
    }

    /**
     * 접근 권한 검증
     */
    private void validateAccess(Note note, UUID memberId) {
        if (note.getCreatedBy().getId().equals(memberId)) return;

        boolean isMember = noteMemberRepository.existsByNoteIdAndMemberId(note.getId(), memberId);
        if (!isMember) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    /**
     * OWNER 권한 검증
     */
    private void validateOwnership(Note note, UUID memberId) {
        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.NOTE_DELETE_PERMISSION_DENIED);
        }
    }
}
