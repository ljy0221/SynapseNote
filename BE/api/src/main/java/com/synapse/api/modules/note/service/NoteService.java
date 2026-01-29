package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.note.document.NoteMetadata; // (구 NoteContent)
import com.synapse.api.modules.note.dto.*;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteMemberId;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteMetadataRepository;
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

    // RDB Repositories
    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final UserRepository userRepository;

    // Mongo Repository
    private final NoteMetadataRepository noteMetadataRepository;

    // Service Delegate (블록 관련 로직 위임)
    private final BlockService blockService;

    /**
     * 노트 생성
     */
    @Transactional
    public NoteResponse createNote(UUID userId, NoteCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1. RDB: 노트 구조 저장
        Note note = Note.builder()
                .title(request.title())
                .directoryPath(request.directoryPath())
                .pointX(request.pointX())
                .pointY(request.pointY())
                .createdBy(user)
                .build();
        Note savedNote = noteRepository.save(note);

        // 2. RDB: 멤버 권한 설정 (OWNER)
        NoteMemberId memberId = new NoteMemberId(savedNote.getId(), user.getId());
        NoteMember noteMember = NoteMember.builder()
                .id(memberId)
                .note(savedNote)
                .user(user)
                .role(NoteRole.OWNER)
                .build();
        noteMemberRepository.save(noteMember);

        // 3. Mongo: 메타데이터 생성 (초기엔 블록 없음)
        NoteMetadata noteMetadata = NoteMetadata.create(savedNote.getId().toString(), request.title());
        noteMetadataRepository.save(noteMetadata);

        log.info("Created note: {} by user: {}", savedNote.getId(), userId);
        return NoteResponse.from(savedNote);
    }

    /**
     * 노트 상세 조회 (RDB + Metadata + Blocks)
     */
    public NoteDetailResponse getNoteById(UUID noteId, UUID userId) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. 권한 검증
        validateAccess(noteId, userId);

        // 3. 메타데이터 조회
        NoteMetadata noteMetadata = noteMetadataRepository.findByNoteId(noteId.toString())
                .orElse(null);

        // 4. [위임] 블록 리스트 조회는 BlockService가 담당
        List<BaseBlock> blocks = blockService.getBlocksByNoteId(noteId.toString());

        // 5. DTO 조합 (Note + Metadata + Blocks)
        return NoteDetailResponse.from(note, noteMetadata, blocks);
    }

    /**
     * 노트 전체 목록 조회
     */
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

    /**
     * 노트 정보 수정 (제목, 경로 등)
     * * 주의: 블록 내용은 수정하지 않음 (Yjs 담당)
     */
    @Transactional
    public NoteResponse updateNote(UUID noteId, UUID userId, NoteUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        // RDB 업데이트
        note.updateTitle(request.title());
        note.updateDirectoryPath(request.directoryPath());

        // Mongo 메타데이터 제목 동기화
        if (request.title() != null) {
            noteMetadataRepository.findByNoteId(noteId.toString())
                    .ifPresent(metadata -> {
                        metadata.updateTitle(request.title());
                        noteMetadataRepository.save(metadata);
                    });
        }

        log.info("Updated note: {} by user: {}", noteId, userId);
        return NoteResponse.from(note);
    }

    /**
     * 노트 좌표 수정
     */
    @Transactional
    public void updatePosition(UUID noteId, UUID userId, NotePositionUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        note.updatePosition(request.pointX(), request.pointY());
    }

    /**
     * 노트 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteNote(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateOwnership(noteId, userId);

        // 1. RDB Soft Delete
        note.delete();

        // 2. Mongo Metadata Soft Delete
        noteMetadataRepository.findByNoteId(noteId.toString())
                .ifPresent(metadata -> {
                    metadata.delete();
                    noteMetadataRepository.save(metadata);
                });

        // 3. [위임] Blocks Soft Delete (선택 사항)
        // blockService.deleteBlocksByNoteId(noteId.toString());

        log.info("Soft deleted note: {} by user: {}", noteId, userId);
    }

    /**
     * 노트 검색
     */
    public List<NoteResponse> searchNotes(UUID userId, String query) {
        return noteRepository.searchByUserAndQuery(userId, query).stream()
                .map(NoteResponse::from)
                .toList();
    }

    // =========================================================================
    // [Delegate] 코드 실행 관련 로직 (BlockService 위임)
    // =========================================================================

    @Transactional
    public void saveExecutionHistory(UUID noteId, String blockId, UUID userId, ExecutionHistoryRequest request) {
        // 1. 권한 체크 (NoteService의 책임)
        validateEditPermission(noteId, userId);

        // 2. 실행 및 저장 (BlockService의 책임)
        blockService.saveExecutionHistory(noteId.toString(), blockId, request);
    }

    public List<ExecutionHistoryResponse> getExecutionHistory(UUID noteId, String blockId, UUID userId, int page, int size) {
        // 1. 권한 체크
        validateAccess(noteId, userId);

        // 2. 조회 위임
        return blockService.getExecutionHistory(noteId.toString(), blockId, page, size);
    }

    // =========================================================================
    // Validation Helper Methods
    // =========================================================================

    private void validateAccess(UUID noteId, UUID userId) {
        if (!hasAccess(noteId, userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    private boolean hasAccess(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        return note.getCreatedBy().getId().equals(userId) ||
                noteMemberRepository.existsByNoteIdAndUserId(noteId, userId);
    }

    private void validateEditPermission(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        if (note.getCreatedBy().getId().equals(userId)) return;

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