package com.synapse.api.modules.note.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.service.BlockService;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.service.MemberService;
import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.request.NotePositionUpdateRequest;
import com.synapse.api.modules.note.dto.request.NoteUpdateRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
import com.synapse.api.modules.note.dto.response.NoteDetailResponse;
import com.synapse.api.modules.note.dto.response.NotePageResponse;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteMemberId;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final NoteValidator noteValidator;

    // [위임] 블록 데이터 및 실행 로직 담당
    private final BlockService blockService;

    // =========================================================================
    // 1. 노트 생성 (Create)
    // =========================================================================
    @Transactional
    public NoteResponse createNote(UUID memberId, NoteCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // RDB: 노트 메타데이터 저장
        Note note = Note.builder()
                .title(request.title())
                .directoryPath(request.directoryPath())
                .pointX(request.pointX())
                .pointY(request.pointY())
                .createdBy(member)
                .build();
        Note savedNote = noteRepository.save(note);

        // RDB: 멤버 권한 설정 (OWNER)
        NoteMemberId noteMemberId = new NoteMemberId(savedNote.getId(), member.getId());
        NoteMember noteMember = NoteMember.builder()
                .id(noteMemberId)
                .note(savedNote)
                .member(member)
                .role(NoteRole.OWNER)
                .build();
        noteMemberRepository.save(noteMember);

        // 스트릭 (일일 1회 제한) - MemberService 위임
        memberService.updateStreak(memberId);

        log.info("Created note: {} by member: {}", savedNote.getId(), noteMemberId);
        return NoteResponse.from(savedNote);
    }

    // =========================================================================
    // 2. 노트 조회 (Read)
    // =========================================================================

    /**
     * 노트 상세 조회: RDB(메타데이터) + Mongo(블록 리스트) 조합
     */
    public NoteDetailResponse getNoteById(UUID noteId, UUID memberId) {
        // 1. RDB 조회 (삭제된 노트 제외)
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. 권한 검증
        noteValidator.validateAccess(note, memberId);

        // 3. Mongo 블록 리스트 조회 (BlockService 위임)
        List<BaseBlock> blocks = blockService.getBlocksByNoteId(noteId);

        // 4. DTO 조합
        return NoteDetailResponse.from(note, blocks);
    }

    public NotePageResponse getAllNotes(UUID memberId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Note> pageResult = noteRepository.findAllNotesByMemberId(memberId, pageRequest);

        Page<NoteResponse> responsePage = pageResult.map(NoteResponse::from);
        return NotePageResponse.from(responsePage);
    }

    // =========================================================================
    // 3. 노트 수정 (Update)
    // =========================================================================

    @Transactional
    public NoteResponse updateNote(UUID noteId, UUID memberId, NoteUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteValidator.validateEditPermission(noteId, memberId);

        // Dirty Checking으로 업데이트 (제목, 경로 등)
        note.updateTitle(request.title());
        note.updateDirectoryPath(request.directoryPath());

        return NoteResponse.from(note);
    }

    /**
     * [요청하신 메소드] 노트 좌표 수정 (Canvas View)
     */
    @Transactional
    public void updatePosition(UUID noteId, UUID memberId, NotePositionUpdateRequest request) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteValidator.validateEditPermission(noteId, memberId);

        note.updatePosition(request.pointX(), request.pointY());
    }

    // =========================================================================
    // 4. 노트 삭제 (Delete)
    // =========================================================================

    /**
     * [요청하신 메소드] 노트 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteNote(UUID noteId, UUID memberId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteValidator.validateOwnership(note, memberId);

        // RDB Soft Delete (deletedAt 설정)
        note.delete();

        // MongoDB 블록도 Soft Delete
        blockService.softDeleteBlocksByNoteId(noteId);

        log.info("Soft deleted note and blocks: {}", noteId);
    }

    // =========================================================================
    // 5. 코드 실행 및 히스토리 (Delegation)
    // =========================================================================

    @Transactional
    public void saveExecutionHistory(UUID noteId, UUID blockId, UUID memberId, ExecutionHistoryRequest request) {
        noteValidator.validateEditPermission(noteId, memberId);

        // 실행 및 저장은 BlockService에 전적으로 위임
        blockService.saveExecutionHistory(noteId, blockId, request);
    }

    /**
     * [요청하신 메소드] 실행 히스토리 조회
     */
    public List<ExecutionHistoryResponse> getExecutionHistory(UUID noteId, UUID blockId, UUID memberId) {
        // 1. 노트 접근 권한 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        noteValidator.validateAccess(note, memberId);

        // 2. 히스토리 조회 위임
        return blockService.getExecutionHistory(noteId, blockId);
    }

    @Transactional
    public void bookmarkNote(UUID memberId, UUID noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteValidator.validateOwnership(note, memberId);

        note.setBookmark();
    }

    @Transactional
    public void unbookmarkNote(UUID memberId, UUID noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteValidator.validateOwnership(note, memberId);

        note.unBookmark();
    }

    public NotePageResponse getNoteBookmarks(UUID memberId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Note> pageResult = noteRepository.findBookmarkedNotesByMemberId(memberId, pageRequest);

        Page<NoteResponse> responsePage = pageResult.map(NoteResponse::from);
        return NotePageResponse.from(responsePage);
    }

    public List<NoteResponse> searchNotes(UUID memberId, String query) {
        // RDB에서 검색 수행
        List<Note> results = noteRepository.searchByMemberAndQuery(memberId, query);
        return results.stream()
                .map(NoteResponse::from)
                .toList();
    }

    @Transactional
    public void bookmarkBlock(UUID memberId, UUID noteId, UUID blockId) {
        // 노트 조회 및 접근 권한 검증
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        noteValidator.validateAccess(note, memberId);

        // BlockService에 위임
        blockService.bookmarkBlock(blockId, noteId);
    }

    @Transactional
    public void unbookmarkBlock(UUID memberId, UUID noteId, UUID blockId) {
        // 노트 조회 및 접근 권한 검증
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        noteValidator.validateAccess(note, memberId);

        // BlockService에 위임
        blockService.unbookmarkBlock(blockId, noteId);
    }

}