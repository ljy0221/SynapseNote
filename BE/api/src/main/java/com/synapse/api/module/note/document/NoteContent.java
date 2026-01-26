package com.synapse.api.module.note.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "notes")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteContent {

    @Id
    private String id;

    @Indexed(unique = true)
    private String noteId;

    private String content;

    @Builder.Default
    private List<CodeBlock> codeBlocks = new ArrayList<>();

    @Builder.Default
    private int version = 1;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    public static NoteContent create(String noteId, String content) {
        return NoteContent.builder()
                .noteId(noteId)
                .content(content)
                .codeBlocks(new ArrayList<>())
                .version(1)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public void updateContent(String content) {
        this.content = content;
        this.updatedAt = LocalDateTime.now();
        incrementVersion();
    }

    public void addCodeBlock(CodeBlock codeBlock) {
        this.codeBlocks.add(codeBlock);
        this.updatedAt = LocalDateTime.now();
        incrementVersion();
    }

    public void removeCodeBlock(String codeBlockId) {
        this.codeBlocks.removeIf(block -> block.getId().equals(codeBlockId));
        this.updatedAt = LocalDateTime.now();
        incrementVersion();
    }

    public void updateCodeBlock(String codeBlockId, String code) {
        this.codeBlocks.stream()
                .filter(block -> block.getId().equals(codeBlockId))
                .findFirst()
                .ifPresent(block -> block.updateCode(code));
        this.updatedAt = LocalDateTime.now();
        incrementVersion();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    private void incrementVersion() {
        this.version++;
    }
}
