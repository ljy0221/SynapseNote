package com.synapse.api.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.ai.dto.request.CodeReviewRequest;
import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.service.NoteValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeAssistantServiceTest {

    @Mock
    private AiServiceFactory aiServiceFactory;
    @Mock
    private NoteValidator noteValidator;
    @Mock
    private BlockRepository blockRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private AiService aiService;

    @InjectMocks
    private CodeAssistantService codeAssistantService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(codeAssistantService, "codeReviewProvider", "OPENAI");
    }

    @Test
    @DisplayName("리뷰 요청시 명시된 언어가 있으면 해당 언어를 우선 사용해야 한다")
    void reviewCode_ShouldUseRequestLanguage_WhenProvided() throws Exception {
        // Given
        UUID noteId = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String storedLanguage = "javascript";
        String requestedLanguage = "python";
        String code = "print('hello')";

        // Mock BlockRepository to return a block with "javascript"
        CodeBlock.CodeProperties properties = CodeBlock.CodeProperties.builder()
                .language(storedLanguage)
                .code(code)
                .build();
        CodeBlock mockBlock = CodeBlock.builder()
                .blockId(blockId)
                .noteId(noteId)
                .properties(properties)
                .build();

        when(blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)).thenReturn(Optional.of(mockBlock));

        // Mock AiServiceFactory to return our mock service
        when(aiServiceFactory.getService(any(AiProvider.class))).thenReturn(aiService);

        // Mock AiService response
        String aiResponse = """
                ```json
                {
                  "reviews": [],
                  "bestPractices": [],
                  "summary": "Good"
                }
                ```
                """;
        when(aiService.complete(anyString(), anyString())).thenReturn(aiResponse);

        // Mock ObjectMapper (avoid actual parsing logic for this test, just return
        // empty)
        // Actually, the service parses the response, so we need to mock objectMapper
        // carefully or just let it throw and catch,
        // OR we can verify the 'complete' call arguments before parsing fails.
        // But better to make it succeed.
        // For simplicity, I will verify the 'complete' call arguments.
        // The parsing part is after the AI call.
        when(objectMapper.readTree(anyString())).thenThrow(new RuntimeException("Skip parsing"));

        // Request with "python"
        CodeReviewRequest request = new CodeReviewRequest(
                AiProvider.OPENAI,
                Collections.emptyList(),
                false,
                requestedLanguage // "python"
        );

        // When
        try {
            codeAssistantService.reviewCode(noteId, blockId, userId, request);
        } catch (RuntimeException e) {
            // Ignore parsing error as we only care about the prompt generation
        }

        // Then
        // Verify that aiService.complete was called with a system prompt containing
        // "python"
        verify(aiService).complete(contains(requestedLanguage), anyString());
        // And NOT "javascript" (unless it's in the user prompt as context, but system
        // prompt should define the role)
        // System prompt: "당신은 %s 언어 전문 코드 리뷰어입니다."
        verify(aiService).complete(contains("당신은 python 언어 전문"), anyString());
    }
}
