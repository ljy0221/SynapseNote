package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.dto.response.BlockDetailResponse;
import com.synapse.api.modules.block.dto.response.CodeBlockResponse;
import com.synapse.api.modules.block.dto.response.TextBlockResponse;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BlockResponseMapper {

    public static BlockDetailResponse from(BaseBlock b) {

        if (b instanceof TextBlock tb) {
            Map<String, Object> raw = tb.getProperties() == null ? null : tb.getProperties().getAttributes();
            if (raw == null) raw = Map.of();

            // known
            String align = (String) raw.get("align");
            String color = (String) raw.get("color");
            boolean bold = Boolean.TRUE.equals(raw.get("bold"));

            // additionalAttributes
            Map<String, Object> additional = new HashMap<>(raw);
            additional.remove("align");
            additional.remove("color");
            additional.remove("bold");

            var attr = TextBlockResponse.TextProperties.Attributes.builder()
                    .align(align)
                    .color(color)
                    .bold(bold)
                    .additionalAttributes(additional.isEmpty() ? null : additional)
                    .build();

            var props = TextBlockResponse.TextProperties.builder()
                    .content(tb.getProperties() == null ? null : tb.getProperties().getContent())
                    .attributes(attr)
                    .build();

            return TextBlockResponse.builder()
                    .id(tb.getId())
                    .noteId(tb.getNoteId())
                    .blockId(tb.getBlockId())
                    .order(tb.getOrder())
                    .bookmark(tb.isBookmark())
                    .createdAt(tb.getCreatedAt())
                    .updatedAt(tb.getUpdatedAt())
                    .properties(props)
                    .build();
        }

        if (b instanceof CodeBlock cb) {

            var props = CodeBlockResponse.CodeProperties.builder()
                    .language(cb.getProperties() == null ? null : cb.getProperties().getLanguage())
                    .code(cb.getProperties() == null ? null : cb.getProperties().getCode())
                    .version(cb.getProperties() == null ? null : cb.getProperties().getVersion())
                    .executionMode(cb.getProperties() == null ? null : cb.getProperties().getExecutionMode())
                    .build();

            List<CodeBlockResponse.OutputHistoryItem> history =
                    cb.getOutputHistory() == null ? List.of() :
                            cb.getOutputHistory().stream()
                                    .map(h -> CodeBlockResponse.OutputHistoryItem.builder()
                                            .output(h.getOutput())
                                            .executedAt(h.getExecutedAt())
                                            .executionTimeMs(h.getExecutionTimeMs())
                                            .status(h.getStatus())
                                            .build()
                                    )
                                    .toList();

            return CodeBlockResponse.builder()
                    .id(cb.getId())
                    .noteId(cb.getNoteId())
                    .blockId(cb.getBlockId())
                    .order(cb.getOrder())
                    .bookmark(cb.isBookmark())
                    .createdAt(cb.getCreatedAt())
                    .updatedAt(cb.getUpdatedAt())
                    .properties(props)
                    .outputHistory(history)
                    .lastOutput(cb.getLastOutput())
                    .lastExecutedAt(cb.getLastExecutedAt())
                    .build();
        }

        throw new BusinessException(ErrorCode.UNSUPPORTED_BLOCK_TYPE);
    }
}