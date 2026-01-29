package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.request.NotePositionUpdateRequest;
import com.synapse.api.modules.note.dto.request.NoteUpdateRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
import com.synapse.api.modules.note.dto.response.NoteDetailResponse;
import com.synapse.api.modules.note.dto.response.NotePageResponse;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.service.NoteService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping("/v1/notes")
    public DataResponse<NoteResponse> createNote(
            @AuthenticationPrincipal CustomUserDetails details,
            @Valid @RequestBody NoteCreateRequest request) {
        UUID userId = details.id();
        log.info("Creating note by user: {}", userId);
        NoteResponse response = noteService.createNote(userId, request);
        return DataResponse.of(SuccessCode.CREATED, response);
    }

    @GetMapping("/v1/notes")
    public DataResponse<NotePageResponse> getAllNotes(
            @AuthenticationPrincipal CustomUserDetails details,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = details.id();
        log.info("Getting all notes for user: {} (page: {}, size: {})", userId, page, size);
        NotePageResponse response = noteService.getAllNotes(userId, page - 1, size);
        return DataResponse.of(response);
    }

    @GetMapping("/v1/notes/{noteId}")
    public DataResponse<NoteDetailResponse> getNoteById(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        log.info("Getting note: {} for user: {}", noteId, userId);
        NoteDetailResponse response = noteService.getNoteById(noteId, userId);
        return DataResponse.of(response);
    }

    @PutMapping("/v1/notes/{noteId}")
    public DataResponse<NoteResponse> updateNote(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @Valid @RequestBody NoteUpdateRequest request) {
        UUID userId = details.id();
        log.info("Updating note: {} by user: {}", noteId, userId);
        NoteResponse response = noteService.updateNote(noteId, userId, request);
        return DataResponse.of(response);
    }

    @PatchMapping("/v1/notes/{noteId}/position")
    public DataResponse<Void> updatePosition(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @Valid @RequestBody NotePositionUpdateRequest request) {
        UUID userId = details.id();
        // [수정됨] Record 접근자 사용: getPointX() -> pointX(), getPointY() -> pointY()
        log.info("Updating note position: {} to ({}, {})", noteId, request.pointX(), request.pointY());
        noteService.updatePosition(noteId, userId, request);
        return DataResponse.of(SuccessCode.NO_CONTENT, null);
    }

    @DeleteMapping("/v1/notes/{noteId}")
    public DataResponse<Void> deleteNote(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        log.info("Deleting note: {} by user: {}", noteId, userId);
        noteService.deleteNote(noteId, userId);
        return DataResponse.of(SuccessCode.NO_CONTENT, null);
    }

    @GetMapping("/v1/notes/search")
    public DataResponse<List<NoteResponse>> searchNotes(
            @AuthenticationPrincipal CustomUserDetails details,
            @RequestParam String q) {
        UUID userId = details.id();
        log.info("Searching notes with query: {} for user: {}", q, userId);
        List<NoteResponse> response = noteService.searchNotes(userId, q);
        return DataResponse.of(response);
    }

    @PostMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public StatusResponse saveExecutionHistory(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId,
            @Valid @RequestBody ExecutionHistoryRequest request) {
        UUID userId = details.id();
        log.info("Saving execution history for block: {} in note: {}", blockId, noteId);
        noteService.saveExecutionHistory(noteId, blockId, userId, request);
        return StatusResponse.of();
    }

    @GetMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public DataResponse<List<ExecutionHistoryResponse>> getExecutionHistory(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId) {
        UUID userId = details.id();
        log.info("Getting execution history for block: {} in note: {}", blockId, noteId);
        List<ExecutionHistoryResponse> response = noteService.getExecutionHistory(noteId, blockId, userId);
        return DataResponse.of(response);
    }

    /**
     * 노트 즐겨찾기
     */

    @PostMapping("/v1/notes/{noteId}/bookmarks")
    public StatusResponse bookmarkNote(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        noteService.bookmarkNote(userId, noteId);
        return StatusResponse.of();
    }

    @DeleteMapping("/v1/notes/{noteId}/bookmarks")
    public StatusResponse unbookmarkNote(
            @AuthenticationPrincipal CustomUserDetails details,
            @PathVariable UUID noteId) {
        UUID userId = details.id();
        noteService.unbookmarkNote(userId, noteId);
        return StatusResponse.of();
    }

    @GetMapping("/v1/notes/bookmarks")
    public DataResponse<NotePageResponse> getNoteBookmarks(
            @AuthenticationPrincipal CustomUserDetails details,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = details.id();
        NotePageResponse response = noteService.getNoteBookmarks(userId, page - 1, size);
        return DataResponse.of(response);
    }
}