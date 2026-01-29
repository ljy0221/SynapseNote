package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.note.dto.*;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteMemberId;
import com.synapse.api.modules.note.entity.NoteRole;
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

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final UserRepository userRepository;

    // [위임] 블록 데이터 및 실행 로직 담당
    private final BlockService blockService;

    // =========================================================================
    // 1. 노트 생성 (Create)
    // =========================================================================
    @Transactional
    public NoteResponse createNote(UUID userId, NoteCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // RDB: 노트 메타데이터 저장
        Note note = Note.builder()
                .title(request.title())
                .directoryPath(request.directoryPath())
                .pointX(request.pointX())
                .pointY(request.pointY())
                .createdBy(user)
                .build();
        Note savedNote = noteRepository.save(note);

        // RDB: 멤버 권한 설정 (OWNER)
        NoteMemberId memberId = new NoteMemberId(savedNote.getId(), user.getId());
        NoteMember noteMember = NoteMember.builder()
                .id(memberId)
                .note(savedNote)
                .user(user)
                .role(NoteRole.OWNER)
                .build();
        noteMemberRepository.save(noteMember);

        log.info("Created note: {} by user: {}", savedNote.getId(), userId);
        return NoteResponse.from(savedNote);
    }

    // =========================================================================
    // 2. 노트 조회 (Read)
    // =========================================================================

    /**
     * 노트 상세 조회: RDB(메타데이터) + Mongo(블록 리스트) 조합
     */
    public NoteDetailResponse getNoteById(UUID noteId, UUID userId) {
        // 1. RDB 조회 (삭제된 노트 제외)
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. 권한 검증
        validateAccess(note, userId);

        // 3. Mongo 블록 리스트 조회 (BlockService 위임)
        List<BaseBlock> blocks = blockService.getBlocksByNoteId(noteId.toString());

        // 4. DTO 조합
        return NoteDetailResponse.from(note, blocks);
    }

    /**
     * [요청하신 메소드] 전체 노트 목록 조회 (내가 만든 것 + 공유받은 것)
     */
    public List<NoteResponse> getAllNotes(UUID userId) {
        // 1. 내가 만든 노트 (Soft Delete 제외)
        // Repository에 @Where가 적용되어 있거나 findBy...AndDeletedAtIsNull 사용 가정
        List<Note> myNotes = noteRepository.findByCreatedByIdAndDeletedAtIsNull(userId);

        // 2. 공유받은 노트
        List<NoteMember> memberNotes = noteMemberRepository.findByUserId(userId);
        List<Note> sharedNotes = memberNotes.stream()
                .map(NoteMember::getNote)
                .filter(n -> n.getDeletedAt() == null) // 삭제된 공유 노트 제외
                .toList();

        // 3. 합치기 및 중복 제거
        return Stream.concat(myNotes.stream(), sharedNotes.stream())
                .distinct()
                .map(NoteResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * [요청하신 메소드] 노트 검색 (제목 기준)
     */
    public List<NoteResponse> searchNotes(UUID userId, String query) {
        // RDB에서 검색 수행
        List<Note> results = noteRepository.searchByUserAndQuery(userId, query);
        return results.stream()
                .map(NoteResponse::from)
                .toList();
    }

    // =========================================================================
    // 3. 노트 수정 (Update)
    // =========================================================================

    @Transactional
    public NoteResponse updateNote(UUID noteId, UUID userId, NoteUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        // Dirty Checking으로 업데이트 (제목, 경로 등)
        note.updateTitle(request.title());
        note.updateDirectoryPath(request.directoryPath());

        return NoteResponse.from(note);
    }

    /**
     * [요청하신 메소드] 노트 좌표 수정 (Canvas View)
     */
    @Transactional
    public void updatePosition(UUID noteId, UUID userId, NotePositionUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateEditPermission(noteId, userId);

        note.updatePosition(request.pointX(), request.pointY());
    }

    // =========================================================================
    // 4. 노트 삭제 (Delete)
    // =========================================================================

    /**
     * [요청하신 메소드] 노트 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteNote(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validateOwnership(note, userId);

        // RDB Soft Delete (deletedAt 설정)
        note.delete();

        // (선택) MongoDB 블록 처리는?
        // 방법 A: 놔둔다. (RDB에서 조회가 안 되니 접근 불가. 나중에 복구 가능)
        // 방법 B: BlockService를 호출해 같이 Soft Delete 처리한다.
        // 여기선 RDB가 진입점이므로 RDB만 처리해도 충분합니다.

        log.info("Soft deleted note: {} by user: {}", noteId, userId);
    }

    // =========================================================================
    // 5. 코드 실행 및 히스토리 (Delegation)
    // =========================================================================

    @Transactional
    public void saveExecutionHistory(UUID noteId, String blockId, UUID userId, ExecutionHistoryRequest request) {
        validateEditPermission(noteId, userId);

        // 실행 및 저장은 BlockService에 전적으로 위임
        blockService.saveExecutionHistory(noteId.toString(), blockId, request);
    }

    /**
     * [요청하신 메소드] 실행 히스토리 조회
     */
    public List<ExecutionHistoryResponse> getExecutionHistory(UUID noteId, String blockId, UUID userId, int page, int size) {
        // 1. 노트 접근 권한 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        validateAccess(note, userId);

        // 2. 히스토리 조회 위임
        return blockService.getExecutionHistory(noteId.toString(), blockId, page, size);
    }

    // =========================================================================
    // Validation Helpers
    // =========================================================================

    private void validateAccess(Note note, UUID userId) {
        if (note.getCreatedBy().getId().equals(userId)) return;

        boolean isMember = noteMemberRepository.existsByNoteIdAndUserId(note.getId(), userId);
        if (!isMember) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
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

    private void validateOwnership(Note note, UUID userId) {
        if (!note.getCreatedBy().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOTE_DELETE_PERMISSION_DENIED);
        }
    }
}