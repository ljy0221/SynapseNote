package com.synapse.api.modules.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.ai.dto.request.CodeReviewRequest;
import com.synapse.api.modules.ai.dto.request.NoteSummaryRequest;
import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.modules.ai.service.AiService;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteMemberId;
import com.synapse.api.modules.note.entity.NoteRole;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.util.security.JwtUtil;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AI API E2E 테스트 - 코드 리뷰 및 노트 요약")
class AiControllerE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteMemberRepository noteMemberRepository;

    @Autowired
    private BlockRepository blockRepository;

    @MockBean(name = "openAiService")
    private AiService mockAiService;

    private String accessToken;
    private Member testMember;
    private Note testNote;
    private CodeBlock testCodeBlock;
    private TextBlock testTextBlock;

    @BeforeEach
    void setUp() {
        // 테스트 회원 생성
        testMember = Member.builder()
                .email("test@example.com")
                .name("Test User")
                .build();
        testMember = memberRepository.save(testMember);

        // JWT 토큰 생성
        accessToken = jwtUtil.generateAccessToken(testMember.getId());

        // 테스트 노트 생성
        testNote = Note.builder()
                .title("AI Test Note")
                .createdBy(testMember)
                .build();
        testNote = noteRepository.save(testNote);

        // 노트 멤버 관계 생성
        NoteMemberId noteMemberId = new NoteMemberId(testNote.getId(), testMember.getId());
        NoteMember noteMember = NoteMember.builder()
                .id(noteMemberId)
                .note(testNote)
                .member(testMember)
                .role(NoteRole.OWNER)
                .build();
        noteMemberRepository.save(noteMember);

        // 테스트 CodeBlock 생성
        testCodeBlock = CodeBlock.builder()
                .blockId(UUID.randomUUID().toString())
                .noteId(testNote.getId().toString())
                .properties(CodeBlock.CodeProperties.builder()
                        .language("java")
                        .code("public class Hello {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}")
                        .version("17")
                        .executionMode("script")
                        .build())
                .bookmark(false)
                .order(1.0)
                .build();
        testCodeBlock = blockRepository.save(testCodeBlock);

        // 테스트 TextBlock 생성
        testTextBlock = TextBlock.builder()
                .blockId(UUID.randomUUID().toString())
                .noteId(testNote.getId().toString())
                .properties(TextBlock.TextProperties.builder()
                        .content("This is a text block for testing")
                        .build())
                .bookmark(false)
                .order(2.0)
                .build();
        testTextBlock = blockRepository.save(testTextBlock);

        // Mock AI 서비스 응답 설정
        String mockCodeReviewResponse = """
                {
                  "reviews": [
                    {
                      "severity": "info",
                      "category": "style",
                      "issue": "클래스 이름이 너무 일반적입니다",
                      "suggestion": "더 구체적인 클래스 이름을 사용하세요 (예: HelloWorldApp)",
                      "lineNumber": 1
                    },
                    {
                      "severity": "warning",
                      "category": "best-practice",
                      "issue": "패키지 선언이 없습니다",
                      "suggestion": "적절한 패키지를 선언하세요",
                      "lineNumber": null
                    }
                  ],
                  "bestPractices": [
                    "적절한 패키지 구조 사용",
                    "의미있는 변수명 사용",
                    "JavaDoc 주석 추가"
                  ],
                  "summary": "전반적으로 기본적인 Java 코드 구조를 따르고 있습니다. 패키지 선언과 더 구체적인 클래스명을 사용하면 좋겠습니다."
                }
                """;

        String mockNoteSummaryResponse = "Java Hello World 프로그램을 포함한 노트입니다. 기본적인 출력 기능을 구현하고 있습니다.";

        when(mockAiService.complete(anyString(), anyString()))
                .thenReturn(mockCodeReviewResponse)
                .thenReturn(mockNoteSummaryResponse);
    }

    @AfterEach
    void tearDown() {
        blockRepository.deleteAll();
        noteMemberRepository.deleteAll();
        noteRepository.deleteAll();
        memberRepository.deleteAll();
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API 성공 - OPENAI 프로바이더")
    void reviewCode_WithOpenAI_Success() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                List.of("performance", "security", "best-practices"),
                true
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), UUID.fromString(testCodeBlock.getBlockId()))
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.blockId").value(testCodeBlock.getBlockId()))
                .andExpect(jsonPath("$.data.language").value("java"))
                .andExpect(jsonPath("$.data.originalCode").exists())
                .andExpect(jsonPath("$.data.reviews").isArray())
                .andExpect(jsonPath("$.data.reviews[0].severity").value("info"))
                .andExpect(jsonPath("$.data.reviews[0].category").value("style"))
                .andExpect(jsonPath("$.data.reviews[0].issue").exists())
                .andExpect(jsonPath("$.data.reviews[0].suggestion").exists())
                .andExpect(jsonPath("$.data.bestPractices").isArray())
                .andExpect(jsonPath("$.data.bestPractices[0]").exists())
                .andExpect(jsonPath("$.data.summary").exists())
                .andExpect(jsonPath("$.data.reviewedAt").exists());
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API - 컨텍스트 포함 안함")
    void reviewCode_WithoutContext_Success() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                List.of("best-practices"),
                false
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), UUID.fromString(testCodeBlock.getBlockId()))
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.blockId").value(testCodeBlock.getBlockId()));
    }

    @Test
    @DisplayName("E2E: 노트 요약 API 성공")
    void summarizeNote_Success() throws Exception {
        NoteSummaryRequest request = new NoteSummaryRequest(
                AiProvider.OPENAI,
                "technical",
                500
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/ai/summary", testNote.getId())
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.noteId").value(testNote.getId().toString()))
                .andExpect(jsonPath("$.data.summary").exists())
                .andExpect(jsonPath("$.data.style").value("technical"))
                .andExpect(jsonPath("$.data.codeBlockCount").value(1))
                .andExpect(jsonPath("$.data.languages").isArray())
                .andExpect(jsonPath("$.data.createdAt").exists());
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API - 인증 없이 호출 시 401 에러")
    void reviewCode_WithoutAuth_Returns401() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                List.of("performance"),
                false
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), UUID.fromString(testCodeBlock.getBlockId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("E2E: 노트 요약 API - 인증 없이 호출 시 401 에러")
    void summarizeNote_WithoutAuth_Returns401() throws Exception {
        NoteSummaryRequest request = new NoteSummaryRequest(
                AiProvider.OPENAI,
                "technical",
                500
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/ai/summary", testNote.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API - TextBlock으로 호출 시 400 에러")
    void reviewCode_WithTextBlock_Returns400() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                List.of("performance"),
                false
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), UUID.fromString(testTextBlock.getBlockId()))
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_BLOCK_TYPE"));
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API - 존재하지 않는 블록 ID로 호출 시 404 에러")
    void reviewCode_WithNonExistentBlock_Returns404() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                List.of("performance"),
                false
        );

        UUID nonExistentBlockId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), nonExistentBlockId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CODE_BLOCK_NOT_FOUND"));
    }

    @Test
    @DisplayName("E2E: 노트 요약 API - 존재하지 않는 노트 ID로 호출 시 404 에러")
    void summarizeNote_WithNonExistentNote_Returns404() throws Exception {
        NoteSummaryRequest request = new NoteSummaryRequest(
                AiProvider.OPENAI,
                "technical",
                500
        );

        UUID nonExistentNoteId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/notes/{noteId}/ai/summary", nonExistentNoteId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("E2E: 코드 리뷰 API - 지원하지 않는 AI 프로바이더 사용 시 400 에러")
    void reviewCode_WithUnsupportedProvider_Returns400() throws Exception {
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.ANTHROPIC,  // 아직 지원하지 않는 프로바이더
                List.of("performance"),
                false
        );

        mockMvc.perform(post("/api/v1/notes/{noteId}/blocks/{blockId}/ai/review",
                        testNote.getId(), UUID.fromString(testCodeBlock.getBlockId()))
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AI_PROVIDER_NOT_SUPPORTED"));
    }
}
