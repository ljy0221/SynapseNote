package com.synapse.api.modules.note.controller;

import com.synapse.api.modules.note.dto.*;
import com.synapse.api.modules.note.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<NoteResponse> createNote(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody NoteCreateRequest request) {
        log.info("Creating note with title: {} by user: {}", request.getTitle(), userId);
        NoteResponse response = noteService.createNote(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/v1/notes")
    public ResponseEntity<List<NoteResponse>> getAllNotes(
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("Getting all notes for user: {}", userId);
        List<NoteResponse> response = noteService.getAllNotes(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/v1/notes/{noteId}")
    public ResponseEntity<NoteDetailResponse> getNoteById(
            @PathVariable UUID noteId,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("Getting note: {} for user: {}", noteId, userId);
        NoteDetailResponse response = noteService.getNoteById(noteId, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/v1/notes/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(
            @PathVariable UUID noteId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody NoteUpdateRequest request) {
        log.info("Updating note: {} by user: {}", noteId, userId);
        NoteResponse response = noteService.updateNote(noteId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/v1/notes/{noteId}/position")
    public ResponseEntity<Void> updatePosition(
            @PathVariable UUID noteId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody NotePositionUpdateRequest request) {
        log.info("Updating note position: {} to ({}, {})", noteId, request.getPointX(), request.getPointY());
        noteService.updatePosition(noteId, userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/v1/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID noteId,
            @RequestHeader("X-User-Id") UUID userId) {
        log.info("Deleting note: {} by user: {}", noteId, userId);
        noteService.deleteNote(noteId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/v1/notes/search")
    public ResponseEntity<List<NoteResponse>> searchNotes(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam String q) {
        log.info("Searching notes with query: {} for user: {}", q, userId);
        List<NoteResponse> response = noteService.searchNotes(userId, q);
        return ResponseEntity.ok(response);
    }
}
