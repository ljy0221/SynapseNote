package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.*;
import com.synapse.api.modules.note.service.NoteService;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new BusinessException(ErrorCode.AUTH_UNAUTHORIZED);
        }
        return ((CustomUserDetails) authentication.getPrincipal()).id();
    }

    @PostMapping("/v1/notes")
    public ResponseEntity<NoteResponse> createNote(
            @Valid @RequestBody NoteCreateRequest request) {
        UUID userId = getCurrentUserId();
        log.info("Creating note with title: {} by user: {}", request.getTitle(), userId);
        NoteResponse response = noteService.createNote(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/v1/notes")
    public ResponseEntity<List<NoteResponse>> getAllNotes() {
        UUID userId = getCurrentUserId();
        log.info("Getting all notes for user: {}", userId);
        List<NoteResponse> response = noteService.getAllNotes(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/v1/notes/{noteId}")
    public ResponseEntity<NoteDetailResponse> getNoteById(
            @PathVariable UUID noteId) {
        UUID userId = getCurrentUserId();
        log.info("Getting note: {} for user: {}", noteId, userId);
        NoteDetailResponse response = noteService.getNoteById(noteId, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/v1/notes/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable UUID noteId,
            @Valid @RequestBody NoteUpdateRequest request) {
        UUID userId = getCurrentUserId();
        log.info("Updating note: {} by user: {}", noteId, userId);
        NoteResponse response = noteService.updateNote(noteId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/v1/notes/{noteId}/position")
    public ResponseEntity<Void> updatePosition(
            @PathVariable UUID noteId,
            @Valid @RequestBody NotePositionUpdateRequest request) {
        UUID userId = getCurrentUserId();
        log.info("Updating note position: {} to ({}, {})", noteId, request.getPointX(), request.getPointY());
        noteService.updatePosition(noteId, userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/v1/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID noteId) {
        UUID userId = getCurrentUserId();
        log.info("Deleting note: {} by user: {}", noteId, userId);
        noteService.deleteNote(noteId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/v1/notes/search")
    public ResponseEntity<List<NoteResponse>> searchNotes(
            @RequestParam String q) {
        UUID userId = getCurrentUserId();
        log.info("Searching notes with query: {} for user: {}", q, userId);
        List<NoteResponse> response = noteService.searchNotes(userId, q);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public ResponseEntity<Void> saveExecutionHistory(
            @PathVariable UUID noteId,
            @PathVariable String blockId,
            @Valid @RequestBody ExecutionHistoryRequest request) {
        UUID userId = getCurrentUserId();
        log.info("Saving execution history for block: {} in note: {}", blockId, noteId);
        noteService.saveExecutionHistory(noteId, blockId, userId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/v1/notes/{noteId}/blocks/{blockId}/executions")
    public ResponseEntity<List<ExecutionHistoryResponse>> getExecutionHistory(
            @PathVariable UUID noteId,
            @PathVariable String blockId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID userId = getCurrentUserId();
        log.info("Getting execution history for block: {} in note: {}", blockId, noteId);
        List<ExecutionHistoryResponse> response = noteService.getExecutionHistory(noteId, blockId, userId, page, size);
        return ResponseEntity.ok(response);
    }
}
