package com.synapse.api.modules.note.service;

import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteValidator {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;

    public NoteRole validateReadPermission(UUID memberId, UUID noteId) {
        // 노트가 있는지
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 노트 작성자인 경우
        if (note.getCreatedBy().getId().equals(memberId)) return NoteRole.OWNER;

        // 노트 멤버인 경우
        return noteMemberRepository.findRoleByNoteIdAndMemberId(noteId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));
    }

    public void validateAccess(Note note, UUID memberId) {
        if (note.getCreatedBy().getId().equals(memberId))
            return;

        boolean isMember = noteMemberRepository.existsByNoteIdAndMemberId(note.getId(), memberId);
        if (!isMember) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    public void validateEditPermission(UUID noteId, UUID memberId) {
        NoteRole role = validateReadPermission(memberId, noteId);

        if (!role.canEdit()) {
            throw new BusinessException(ErrorCode.NOTE_EDIT_PERMISSION_DENIED);
        }
    }

    public void validateOwnership(Note note, UUID memberId) {
        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.NOTE_DELETE_PERMISSION_DENIED);
        }
    }

}
