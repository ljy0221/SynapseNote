package com.synapse.api.modules.note.service;

import com.synapse.api.modules.note.document.NoteContent;
import com.synapse.api.modules.note.dto.*;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteContentRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.user.entity.User;
import com.synapse.api.modules.user.repository.UserRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final NoteContentRepository noteContentRepository;
    private final UserRepository userRepository;

    @Transactional
    public NoteResponse createNote(UUID userId, NoteCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Note note = Note.builder()
                .title(request.getTitle())
                .directoryPath(request.getDirectoryPath())
                .pointX(request.getPointX())
                .pointY(request.getPointY())
                .createdBy(user)
                .build();

        Note savedNote = noteRepository.save(note);

        NoteMember noteMember = NoteMember.builder()
                .note(savedNote)
                .user(user)
                .role(NoteRole.OWNER)
                .build();
        noteMemberRepository.save(noteMember);

        String content = request.getContent() != null ? request.getContent() : "";
        NoteContent noteContent = NoteContent.create(savedNote.getId().toString(), content);
        noteContentRepository.save(noteContent);

        log.info("Created note: {} by user: {}", savedNote.getId(), userId);
        return NoteResponse.from(savedNote);
    }

    public NoteDetailResponse getNoteById(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateAccess(noteId, userId);

        NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                .orElse(null);

        return NoteDetailResponse.from(note, noteContent);
    }

    public List<NoteResponse> getAllNotes(UUID userId) {
        List<Note> createdNotes = noteRepository.findByCreatedById(userId);

        List<NoteMember> memberNotes = noteMemberRepository.findByUserId(userId);
        List<Note> sharedNotes = memberNotes.stream()
                .map(NoteMember::getNote)
                .filter(note -> !note.getCreatedBy().getId().equals(userId))
                .toList();

        return Stream.concat(createdNotes.stream(), sharedNotes.stream())
                .distinct()
                .map(NoteResponse::from)
                .toList();
    }

    @Transactional
    public NoteResponse updateNote(UUID noteId, UUID userId, NoteUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        note.updateTitle(request.getTitle());
        note.updateDirectoryPath(request.getDirectoryPath());

        if (request.getContent() != null) {
            NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));
            noteContent.updateContent(request.getContent());
            noteContentRepository.save(noteContent);
        }

        log.info("Updated note: {} by user: {}", noteId, userId);
        return NoteResponse.from(note);
    }

    @Transactional
    public void updatePosition(UUID noteId, UUID userId, NotePositionUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        note.updatePosition(request.getPointX(), request.getPointY());
        log.info("Updated note position: {} to ({}, {})", noteId, request.getPointX(), request.getPointY());
    }

    @Transactional
    public void deleteNote(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateOwnership(noteId, userId);

        // Soft delete
        note.delete();

        // MongoDB도 soft delete
        NoteContent content = noteContentRepository.findByNoteId(noteId.toString())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));
        content.delete();
        noteContentRepository.save(content);

        log.info("Soft deleted note: {} by user: {}", noteId, userId);
    }

    public List<NoteResponse> searchNotes(UUID userId, String query) {
        List<Note> results = noteRepository.searchByUserAndQuery(userId, query);
        return results.stream()
                .map(NoteResponse::from)
                .toList();
    }

    private void validateAccess(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        boolean isCreator = note.getCreatedBy().getId().equals(userId);
        boolean isMember = noteMemberRepository.existsByNoteIdAndUserId(noteId, userId);

        if (!isCreator && !isMember) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    private void validateEditPermission(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        if (note.getCreatedBy().getId().equals(userId)) {
            return;
        }

        NoteRole role = noteMemberRepository.findRoleByNoteIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));

        if (!role.canEdit()) {
            throw new BusinessException(ErrorCode.NOTE_EDIT_PERMISSION_DENIED);
        }
    }

    private void validateOwnership(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        if (!note.getCreatedBy().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOTE_DELETE_PERMISSION_DENIED);
        }
    }
}
