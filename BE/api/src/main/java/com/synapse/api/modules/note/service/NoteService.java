package com.synapse.api.modules.note.service;

import com.synapse.api.modules.note.document.CodeBlock;
import com.synapse.api.modules.note.document.NoteContent;
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
import com.synapse.api.modules.note.repository.NoteContentRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.user.entity.User;
import com.synapse.api.modules.user.repository.UserRepository;
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

                // [변경] Record 접근자 사용 (getXXX() -> xxx())
                Note note = Note.builder()
                                .title(request.title())
                                .directoryPath(request.directoryPath())
                                .pointX(request.pointX())
                                .pointY(request.pointY())
                                .createdBy(user)
                                .build();

                Note savedNote = noteRepository.save(note);

                // 명시적으로 복합 키 생성
                NoteMemberId memberId = new NoteMemberId(
                                savedNote.getId(), // noteId
                                user.getId() // userId
                );

                NoteMember noteMember = NoteMember.builder()
                                .id(memberId) // 명시적 ID 설정
                                .note(savedNote) // JPA 관계 유지 (lazy loading, cascade 지원)
                                .user(user) // JPA 관계 유지
                                .role(NoteRole.OWNER)
                                .build();
                noteMemberRepository.save(noteMember);

                // [변경] Record 접근자 사용
                String content = request.content() != null ? request.content() : "";
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

                // [변경] Record 접근자 사용
                note.updateTitle(request.title());
                note.updateDirectoryPath(request.directoryPath());

                // [변경] Record 접근자 사용
                if (request.content() != null) {
                        NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                                        .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));
                        noteContent.updateContent(request.content());
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

                // [변경] Record 접근자 사용
                note.updatePosition(request.pointX(), request.pointY());
                log.info("Updated note position: {} to ({}, {})", noteId, request.pointX(), request.pointY());
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

        @Transactional
        public void saveExecutionHistory(UUID noteId, String blockId, UUID userId, ExecutionHistoryRequest request) {
                // 1. 편집 권한 검증 (EDITOR or OWNER)
                validateEditPermission(noteId, userId);

                // 2. NoteContent 조회
                NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));

                // 3. CodeBlock 찾기
                CodeBlock targetBlock = noteContent.getCodeBlocks().stream()
                                .filter(block -> block.getId().equals(blockId))
                                .findFirst()
                                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

                // 4. 실행 이력 추가 (CodeBlock.execute() 활용)
                // [변경] Record 접근자 사용
                targetBlock.execute(
                                request.output(),
                                request.executionTimeMs(),
                                request.status());

                // 5. 버전 증가 및 저장
                noteContent.updateContent(noteContent.getContent());
                noteContentRepository.save(noteContent);

                log.info("Saved execution history for block: {} in note: {}", blockId, noteId);
        }

        public List<ExecutionHistoryResponse> getExecutionHistory(UUID noteId, String blockId, UUID userId, int page,
                                                                  int size) {
                // 1. 조회 권한 검증
                validateAccess(noteId, userId);

                // 2. NoteContent 조회
                NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));

                // 3. CodeBlock 찾기
                CodeBlock targetBlock = noteContent.getCodeBlocks().stream()
                                .filter(block -> block.getId().equals(blockId))
                                .findFirst()
                                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

                // 4. 실행 이력 조회 (최신순, 페이징)
                List<CodeBlock.ExecutionHistory> history = targetBlock.getOutputHistory();

                // 최신순 정렬
                List<CodeBlock.ExecutionHistory> reversedHistory = new java.util.ArrayList<>(history);
                java.util.Collections.reverse(reversedHistory);

                // 페이징 적용
                int start = page * size;
                int end = Math.min(start + size, reversedHistory.size());

                if (start >= reversedHistory.size()) {
                        return List.of();
                }

                return reversedHistory.subList(start, end).stream()
                                .map(ExecutionHistoryResponse::from)
                                .toList();
        }

        @Transactional
        public void bookmarkNote(UUID userId, UUID noteId) {
                validateOwnership(noteId, userId);

                Note note = noteRepository.findById(noteId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

                note.setBookmark();
        }

        @Transactional
        public void unbookmarkNote(UUID userId, UUID noteId) {
                validateOwnership(noteId, userId);

                Note note = noteRepository.findById(noteId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

                note.unBookmark();
        }

        public NotePageResponse getNoteBookmarks(UUID userId, int page, int size) {
                PageRequest pageRequest = PageRequest.of(page, size);
                Page<Note> pageResult = noteMemberRepository.findBookmarkedNotesByUserId(userId, pageRequest);

                Page<NoteResponse> responsePage = pageResult.map(NoteResponse::from);
                return NotePageResponse.from(responsePage);
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