package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    // 1. 기본 조회 (Soft Delete 적용: deletedAt이 null인 것만 조회)
    // * 주의: Entity 클래스에 @Where(clause = "deleted_at IS NULL") 설정이 있다면
    //   findById 등 기본 메서드도 자동으로 삭제된 걸 걸러줍니다.
    //   없다면 아래처럼 명시적으로 만들어야 합니다.
    Optional<Note> findByIdAndDeletedAtIsNull(UUID id);

    // 2. 내 노트 목록 조회 (특정 디렉토리 하위 조회 시 사용 가능)
    List<Note> findByCreatedByIdAndDeletedAtIsNull(UUID userId);

    @Query("SELECT n FROM Note n WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Note> findById(@Param("id") UUID id);

    // 3. 디렉토리별 조회 (탐색기 기능용)
    List<Note> findByCreatedByIdAndDirectoryPathAndDeletedAtIsNull(UUID userId, String directoryPath);

    // 5. 검색 기능 (제목 기준)
    @Query("SELECT n FROM Note n " +
            "WHERE n.createdBy.id = :userId " +
            "AND n.title LIKE %:query% " +
            "AND n.deletedAt IS NULL")
    List<Note> searchByUserAndQuery(@Param("userId") UUID userId, @Param("query") String query);

    @Query("SELECT n FROM Note n WHERE n.createdBy.id = :userId AND n.pointX IS NOT NULL AND n.pointY IS NOT NULL")
    List<Note> findMindMapNodesByUser(UUID userId);

    @Modifying
    @Query("UPDATE Note n SET n.pointX = NULL, n.pointY = NULL " +
            "WHERE n.createdBy.id = :userId AND n.pointX IS NOT NULL")
    int resetMindmapNodePositions(@Param("userId") UUID userId);

    @Query(value = "SELECT n FROM Note n " +
            "LEFT JOIN NoteMember nm ON n.id = nm.note.id AND nm.user.id = :userId AND nm.deletedAt IS NULL "
            +
            "JOIN FETCH n.createdBy " +
            "WHERE n.deletedAt IS NULL " +
            "AND (n.createdBy.id = :userId OR nm.id IS NOT NULL) " +
            "ORDER BY n.updatedAt DESC",
            countQuery = "SELECT COUNT(n) FROM Note n " +
                    "LEFT JOIN NoteMember nm ON n.id = nm.note.id AND nm.user.id = :userId AND nm.deletedAt IS NULL "
                    +
                    "WHERE n.deletedAt IS NULL " +
                    "AND (n.createdBy.id = :userId OR nm.id IS NOT NULL)")
    Page<Note> findAllNotesByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT n FROM Note n JOIN FETCH n.createdBy WHERE n.createdBy.id = :userId " +
            "AND n.bookmark = true AND n.deletedAt IS NULL " +
            "ORDER BY n.updatedAt DESC")
    Page<Note> findBookmarkedNotesByUserId(@Param("userId") UUID userId, Pageable pageable);
    // 6. 중복 제목 검사 등 (같은 폴더 내 이름 중복 방지용)
    boolean existsByCreatedByIdAndDirectoryPathAndTitleAndDeletedAtIsNull(UUID userId, String directoryPath, String title);
}