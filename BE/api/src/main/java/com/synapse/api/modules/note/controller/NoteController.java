package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.block.dto.response.BlockPageResponse;
import com.synapse.api.modules.note.dto.response.StreakResponse;
import com.synapse.api.modules.note.dto.request.ExecutionHistoryRequest;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.request.NoteUpdateRequest;
import com.synapse.api.modules.note.dto.response.ExecutionHistoryResponse;
import com.synapse.api.modules.note.dto.response.NoteDetailResponse;
import com.synapse.api.modules.note.dto.response.NotePageResponse;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.service.NoteService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.response.SuccessCode;
import com.synapse.api.util.security.CustomMemberDetails;
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
            @AuthenticationPrincipal CustomMemberDetails details,
            @Valid @RequestBody NoteCreateRequest request) {
        UUID memberId = details.id();
        log.info("Creating note by member: {}", memberId);
        NoteResponse response = noteService.createNote(memberId, request);
        return DataResponse.of(SuccessCode.CREATED, response);
    }

    @GetMapping("/v1/notes")
    public DataResponse<NotePageResponse> getAllNotes(
            @AuthenticationPrincipal CustomMemberDetails details,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID memberId = details.id();
        log.info("Getting all notes for member: {} (page: {}, size: {})", memberId, page, size);
        NotePageResponse response = noteService.getAllNotes(memberId, page - 1, size);
        return DataResponse.of(response);
    }

    @GetMapping("/v1/notes/{noteId}")
    public DataResponse<NoteDetailResponse> getNoteById(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID memberId = details.id();
        log.info("Getting note: {} for member: {}", noteId, memberId);
        NoteDetailResponse response = noteService.getNoteById(noteId, memberId);
        return DataResponse.of(response);
    }

    @PutMapping("/v1/notes/{noteId}")
    public DataResponse<NoteResponse> updateNote(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @Valid @RequestBody NoteUpdateRequest request) {
        UUID memberId = details.id();
        log.info("Updating note: {} by member: {}", noteId, memberId);
        NoteResponse response = noteService.updateNote(noteId, memberId, request);
        return DataResponse.of(response);
    }

    @DeleteMapping("/v1/notes/{noteId}")
    public DataResponse<Void> deleteNote(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID memberId = details.id();
        log.info("Deleting note: {} by member: {}", noteId, memberId);
        noteService.deleteNote(noteId, memberId);
        return DataResponse.of(SuccessCode.NO_CONTENT, null);
    }

    @GetMapping("/v1/notes/search")
    public DataResponse<List<NoteResponse>> searchNotes(
            @AuthenticationPrincipal CustomMemberDetails details,
            @RequestParam String q) {
        UUID memberId = details.id();
        log.info("Searching notes with query: {} for member: {}", q, memberId);
        List<NoteResponse> response = noteService.searchNotes(memberId, q);
        return DataResponse.of(response);
    }

    @PostMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public StatusResponse saveExecutionHistory(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId,
            @Valid @RequestBody ExecutionHistoryRequest request) {
        UUID memberId = details.id();
        log.info("Saving execution history for block: {} in note: {}", blockId, noteId);
        noteService.saveExecutionHistory(noteId, blockId, memberId, request);
        return StatusResponse.of();
    }

    @GetMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public DataResponse<List<ExecutionHistoryResponse>> getExecutionHistory(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId) {
        UUID memberId = details.id();
        log.info("Getting execution history for block: {} in note: {}", blockId, noteId);
        List<ExecutionHistoryResponse> response = noteService.getExecutionHistory(noteId, blockId, memberId);
        return DataResponse.of(response);
    }

    /**
     * 노트 즐겨찾기
     */

    @PostMapping("/v1/notes/{noteId}/bookmarks")
    public StatusResponse bookmarkNote(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID memberId = details.id();
        noteService.bookmarkNote(memberId, noteId);
        return StatusResponse.of();
    }

    @DeleteMapping("/v1/notes/{noteId}/bookmarks")
    public StatusResponse unbookmarkNote(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId) {
        UUID memberId = details.id();
        noteService.unbookmarkNote(memberId, noteId);
        return StatusResponse.of();
    }

    @GetMapping("/v1/notes/bookmarks")
    public DataResponse<NotePageResponse> getNoteBookmarks(
            @AuthenticationPrincipal CustomMemberDetails details,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID memberId = details.id();
        NotePageResponse response = noteService.getNoteBookmarks(memberId, page - 1, size);
        return DataResponse.of(response);
    }

    /**
     * 블록 즐겨찾기
     */

    @PostMapping("/v1/notes/{noteId}/blocks/{blockId}/bookmarks")
    public StatusResponse bookmarkBlock(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId) {
        UUID memberId = details.id();
        noteService.bookmarkBlock(memberId, noteId, blockId);
        return StatusResponse.of();
    }

    @DeleteMapping("/v1/notes/{noteId}/blocks/{blockId}/bookmarks")
    public StatusResponse unbookmarkBlock(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable String blockId) {
        UUID memberId = details.id();
        noteService.unbookmarkBlock(memberId, noteId, blockId);
        return StatusResponse.of();
    }

    @GetMapping("/v1/notes/{noteId}/blocks/bookmarks")
    public DataResponse<BlockPageResponse> getBlockBookmarks(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID memberId = details.id();
        BlockPageResponse response = noteService.getBlockBookmarks(memberId, noteId, page - 1, size);
        return DataResponse.of(response);
    }

    @GetMapping("/v1/members/{memberId}/streak")
    public DataResponse<List<StreakResponse>> getStreak(@PathVariable UUID memberId) {
        log.info("Getting streak for member: {}", memberId);
        List<StreakResponse> response = noteService.getStreak(memberId);
        return DataResponse.of(response);
    }
}