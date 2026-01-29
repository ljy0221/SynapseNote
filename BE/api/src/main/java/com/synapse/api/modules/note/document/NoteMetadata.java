package com.synapse.api.modules.note.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notes") // 문서 메타데이터 저장소
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteMetadata {

    @Id
    private String id;

    @Indexed(unique = true)
    private String noteId; // 이 ID가 Block들의 docId와 매칭됩니다.

    // 기존 content -> title로 변경 추천
    // 본문은 Block 컬렉션에 있으므로, 여기는 "문서 제목"만 관리합니다.
    private String title;

    @Builder.Default
    private String type = "page"; // 'page', 'canvas' 등 뷰 타입

    @Builder.Default
    private Boolean favorite = false;

    // 아이콘, 커버 이미지 등이 필요하다면 여기에 추가
    private String icon;
    private String coverImage;

    @Builder.Default
    private int version = 1;

    private LocalDateTime createdAt; // 생성일 추가 추천
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;

    public static NoteMetadata create(String noteId, String title) {
        return NoteMetadata.builder()
                .noteId(noteId)
                .title(title)
                .type("page")
                .favorite(false)
                .version(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // --- 가벼워진 비즈니스 로직 ---

    public void updateTitle(String title) {
        this.title = title;
        this.updatedAt = LocalDateTime.now();
    }

    public void toggleFavorite() {
        this.favorite = !this.favorite;
        this.updatedAt = LocalDateTime.now();
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}