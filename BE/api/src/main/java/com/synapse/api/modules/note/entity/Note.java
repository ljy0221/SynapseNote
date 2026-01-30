package com.synapse.api.modules.note.entity;

import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where; // (선택) Soft Delete 자동 처리용
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
// [선택] 조회 시 삭제된(deleted_at is not null) 데이터는 자동으로 제외
@Where(clause = "deleted_at IS NULL")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    // 디렉토리 경로 (예: /work/projects)
    private String directoryPath;

    // Canvas 뷰일 때 좌표 (없으면 null)
    @Column(name = "point_x")
    private Double pointX;

    @Column(name = "point_y")
    private Double pointY;

    @Column
    private boolean bookmark;

    // [핵심] 낙관적 락 (Optimistic Locking)
    // 메타데이터(제목, 위치 등)가 동시에 수정될 때 충돌 방지
    // JPA가 save 할 때 자동으로 +1 해줍니다.
    @Version
    private Long version;

    // 삭제 시간 (Soft Delete)
    private LocalDateTime deletedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // 생성자 (User와 연관관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private Member createdBy;

    @OneToMany(mappedBy = "from", cascade = CascadeType.REMOVE)
    @Builder.Default
    private List<MindmapEdge> fanoutEdges = new ArrayList<>();

    @OneToMany(mappedBy = "to", cascade = CascadeType.REMOVE)
    @Builder.Default
    private List<MindmapEdge> faninEdges = new ArrayList<>();

    public void updateTitle(String title) {
        this.title = title;
    }

    public void updateDirectoryPath(String path) {
        this.directoryPath = path;
    }

    public void updatePosition(Double x, Double y) {
        this.pointX = x;
        this.pointY = y;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    // 복구 기능이 있다면
    public void restore() {
        this.deletedAt = null;
    }

    public void deleteNode() {
        this.pointX = null;
        this.pointY = null;
    }

    public void setBookmark() {
        bookmark = true;
    }

    public void unBookmark() {
        bookmark = false;
    }
}
