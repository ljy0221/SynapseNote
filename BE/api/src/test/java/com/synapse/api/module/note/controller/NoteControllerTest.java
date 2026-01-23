package com.synapse.api.module.note.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.common.exception.BusinessException;
import com.synapse.api.common.exception.ErrorCode;
import com.synapse.api.module.note.dto.*;
import com.synapse.api.module.note.service.NoteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NoteController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(com.synapse.api.common.exception.GlobalExceptionHandler.class)
@DisplayName("NoteController 단위 테스트")
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NoteService noteService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID userId;
    private UUID noteId;
    private NoteResponse noteResponse;
    private NoteDetailResponse noteDetailResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        noteResponse = NoteResponse.builder()
                .id(noteId)
                .title("Test Note")
                .directoryPath("/test")
                .pointX(100.0)
                .pointY(200.0)
                .createdBy(userId)
                .createdByName("Test User")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        noteDetailResponse = NoteDetailResponse.builder()
                .id(noteId)
                .title("Test Note")
                .directoryPath("/test")
                .pointX(100.0)
                .pointY(200.0)
                .createdBy(userId)
                .createdByName("Test User")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .content("Test Content")
                .codeBlocks(Collections.emptyList())
                .version(1)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/notes - 노트 생성 성공")
    void createNote_Success() throws Exception {
        // given
        NoteCreateRequest request = NoteCreateRequest.builder()
                .title("New Note")
                .directoryPath("/new")
                .pointX(50.0)
                .pointY(100.0)
                .content("New Content")
                .build();

        given(noteService.createNote(eq(userId), any(NoteCreateRequest.class)))
                .willReturn(noteResponse);

        // when & then
        mockMvc.perform(post("/api/v1/notes")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(noteId.toString()))
                .andExpect(jsonPath("$.title").value("Test Note"))
                .andExpect(jsonPath("$.directoryPath").value("/test"));
    }

    @Test
    @DisplayName("POST /api/v1/notes - 검증 실패 (제목 없음)")
    void createNote_ValidationFail_NoTitle() throws Exception {
        // given
        NoteCreateRequest request = NoteCreateRequest.builder()
                .directoryPath("/new")
                .build();

        // when & then
        mockMvc.perform(post("/api/v1/notes")
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/notes - 전체 노트 조회 성공")
    void getAllNotes_Success() throws Exception {
        // given
        List<NoteResponse> responses = List.of(noteResponse);
        given(noteService.getAllNotes(userId)).willReturn(responses);

        // when & then
        mockMvc.perform(get("/api/v1/notes")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].title").value("Test Note"));
    }

    @Test
    @DisplayName("GET /api/v1/notes - 빈 목록 반환")
    void getAllNotes_Empty() throws Exception {
        // given
        given(noteService.getAllNotes(userId)).willReturn(Collections.emptyList());

        // when & then
        mockMvc.perform(get("/api/v1/notes")
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("GET /api/v1/notes/{noteId} - 노트 조회 성공")
    void getNoteById_Success() throws Exception {
        // given
        given(noteService.getNoteById(noteId, userId)).willReturn(noteDetailResponse);

        // when & then
        mockMvc.perform(get("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(noteId.toString()))
                .andExpect(jsonPath("$.title").value("Test Note"))
                .andExpect(jsonPath("$.content").value("Test Content"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/notes/{noteId} - 노트 없음 (404)")
    void getNoteById_NotFound() throws Exception {
        // given
        given(noteService.getNoteById(noteId, userId))
                .willThrow(new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/notes/{noteId} - 접근 권한 없음 (403)")
    void getNoteById_AccessDenied() throws Exception {
        // given
        given(noteService.getNoteById(noteId, userId))
                .willThrow(new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));

        // when & then
        mockMvc.perform(get("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/v1/notes/{noteId} - 노트 수정 성공")
    void updateNote_Success() throws Exception {
        // given
        NoteUpdateRequest request = NoteUpdateRequest.builder()
                .title("Updated Title")
                .directoryPath("/updated")
                .content("Updated Content")
                .build();

        given(noteService.updateNote(eq(noteId), eq(userId), any(NoteUpdateRequest.class)))
                .willReturn(noteResponse);

        // when & then
        mockMvc.perform(put("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(noteId.toString()))
                .andExpect(jsonPath("$.title").value("Test Note"));
    }

    @Test
    @DisplayName("PUT /api/v1/notes/{noteId} - 권한 없음 (403)")
    void updateNote_AccessDenied() throws Exception {
        // given
        NoteUpdateRequest request = NoteUpdateRequest.builder()
                .title("Updated Title")
                .build();

        given(noteService.updateNote(eq(noteId), eq(userId), any(NoteUpdateRequest.class)))
                .willThrow(new BusinessException(ErrorCode.NOTE_EDIT_PERMISSION_DENIED));

        // when & then
        mockMvc.perform(put("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/v1/notes/{noteId}/position - 위치 업데이트 성공")
    void updatePosition_Success() throws Exception {
        // given
        NotePositionUpdateRequest request = NotePositionUpdateRequest.builder()
                .pointX(300.0)
                .pointY(400.0)
                .build();

        doNothing().when(noteService).updatePosition(eq(noteId), eq(userId), any(NotePositionUpdateRequest.class));

        // when & then
        mockMvc.perform(patch("/api/v1/notes/{noteId}/position", noteId)
                        .header("X-User-Id", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/v1/notes/{noteId} - 노트 삭제 성공")
    void deleteNote_Success() throws Exception {
        // given
        doNothing().when(noteService).deleteNote(noteId, userId);

        // when & then
        mockMvc.perform(delete("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/v1/notes/{noteId} - 권한 없음 (403)")
    void deleteNote_AccessDenied() throws Exception {
        // given
        doThrow(new BusinessException(ErrorCode.NOTE_DELETE_PERMISSION_DENIED))
                .when(noteService).deleteNote(noteId, userId);

        // when & then
        mockMvc.perform(delete("/api/v1/notes/{noteId}", noteId)
                        .header("X-User-Id", userId.toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/notes/search - 검색 성공")
    void searchNotes_Success() throws Exception {
        // given
        String query = "test";
        List<NoteResponse> responses = List.of(noteResponse);
        given(noteService.searchNotes(userId, query)).willReturn(responses);

        // when & then
        mockMvc.perform(get("/api/v1/notes/search")
                        .header("X-User-Id", userId.toString())
                        .param("q", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].title").value("Test Note"));
    }

    @Test
    @DisplayName("GET /api/v1/notes/search - 빈 결과 반환")
    void searchNotes_Empty() throws Exception {
        // given
        String query = "nonexistent";
        given(noteService.searchNotes(userId, query)).willReturn(Collections.emptyList());

        // when & then
        mockMvc.perform(get("/api/v1/notes/search")
                        .header("X-User-Id", userId.toString())
                        .param("q", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
