package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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
    // findById 등 기본 메서드도 자동으로 삭제된 걸 걸러줍니다.
    // 없다면 아래처럼 명시적으로 만들어야 합니다.
    Optional<Note> findByIdAndDeletedAtIsNull(UUID id);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM Note n WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Note> findByIdWithLock(@Param("id") UUID id);

    long countByCreatedBy_IdAndDeletedAtIsNull(UUID memberId);

    @Query("SELECT COUNT(n) FROM Note n " +
            "JOIN NoteMember nm ON n.id = nm.note.id " +
            "WHERE nm.member.id = :memberId " +
            "AND nm.deletedAt IS NULL " +
            "AND n.createdBy.id != :memberId " +
            "AND n.deletedAt IS NULL")
    long countSharedNotesByMemberId(@Param("memberId") UUID memberId);

    // 2. 내 노트 목록 조회 (특정 디렉토리 하위 조회 시 사용 가능)
    List<Note> findByCreatedByIdAndDeletedAtIsNull(UUID memberId);

    @Query("SELECT n FROM Note n JOIN FETCH n.createdBy WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Note> findById(@Param("id") UUID id);

    // 3. 디렉토리별 조회 (탐색기 기능용)
    List<Note> findByCreatedByIdAndDirectoryPathAndDeletedAtIsNull(UUID memberId, String directoryPath);

    // 5. 검색 기능 (제목 기준)
    @Query("SELECT n FROM Note n " +
            "WHERE n.createdBy.id = :memberId " +
            "AND n.title LIKE %:query% " +
            "AND n.deletedAt IS NULL")
    List<Note> searchByMemberAndQuery(@Param("memberId") UUID memberId, @Param("query") String query);

    @Query("""
            SELECT DISTINCT n FROM Note n
            JOIN FETCH n.createdBy
            JOIN MindmapNodePosition mnp ON n.id = mnp.id.noteId AND mnp.id.memberId = :memberId
            LEFT JOIN NoteMember nm ON n.id = nm.note.id AND nm.member.id = :memberId AND nm.deletedAt IS NULL
            WHERE (n.createdBy.id = :memberId OR nm.id IS NOT NULL)
              AND n.deletedAt IS NULL
            """)
    List<Note> findMindMapNodesByMember(@Param("memberId") UUID memberId);

    @Query(value = "SELECT n FROM Note n " +
            "LEFT JOIN NoteMember nm ON n.id = nm.note.id AND nm.member.id = :memberId AND nm.deletedAt IS NULL "
            +
            "JOIN FETCH n.createdBy " +
            "WHERE n.deletedAt IS NULL " +
            "AND (n.createdBy.id = :memberId OR nm.id IS NOT NULL) " +
            "ORDER BY n.updatedAt DESC", countQuery = "SELECT COUNT(n) FROM Note n " +
            "LEFT JOIN NoteMember nm ON n.id = nm.note.id AND nm.member.id = :memberId AND nm.deletedAt IS NULL "
            +
            "WHERE n.deletedAt IS NULL " +
            "AND (n.createdBy.id = :memberId OR nm.id IS NOT NULL)")
    Page<Note> findAllNotesByMemberId(@Param("memberId") UUID memberId, Pageable pageable);

    @Query("SELECT n FROM Note n JOIN FETCH n.createdBy WHERE n.createdBy.id = :memberId " +
            "AND n.bookmark = true AND n.deletedAt IS NULL " +
            "ORDER BY n.updatedAt DESC")
    Page<Note> findBookmarkedNotesByMemberId(@Param("memberId") UUID memberId, Pageable pageable);

    // 내가 만든 노트만 조회
    @Query("SELECT n FROM Note n JOIN FETCH n.createdBy " +
            "WHERE n.createdBy.id = :memberId AND n.deletedAt IS NULL " +
            "ORDER BY n.updatedAt DESC")
    Page<Note> findOwnedNotesByMemberId(@Param("memberId") UUID memberId, Pageable pageable);

    // 내가 공유받은 노트만 조회 (내가 만들지 않은 것)
    @Query(value = "SELECT n FROM Note n " +
            "JOIN NoteMember nm ON n.id = nm.note.id " +
            "JOIN FETCH n.createdBy " +
            "WHERE nm.member.id = :memberId " +
            "AND nm.deletedAt IS NULL " +
            "AND n.createdBy.id != :memberId " +
            "AND n.deletedAt IS NULL " +
            "ORDER BY n.updatedAt DESC", countQuery = "SELECT COUNT(n) FROM Note n " +
            "JOIN NoteMember nm ON n.id = nm.note.id " +
            "WHERE nm.member.id = :memberId " +
            "AND nm.deletedAt IS NULL " +
            "AND n.createdBy.id != :memberId " +
            "AND n.deletedAt IS NULL")
    Page<Note> findSharedNotesByMemberId(@Param("memberId") UUID memberId, Pageable pageable);

    // 6. 중복 제목 검사 등 (같은 폴더 내 이름 중복 방지용)
    boolean existsByCreatedByIdAndDirectoryPathAndTitleAndDeletedAtIsNull(UUID memberId, String directoryPath,
                                                                          String title);

    @Query("SELECT n.id FROM Note n WHERE n.createdBy.id = :memberId AND n.deletedAt IS NULL")
    List<UUID> findAllNoteIdsByMemberId(@Param("memberId") UUID memberId);

    // 여러 ID로 노트 조회 (createdBy JOIN FETCH — MindmapService N+1 방지)
    @Query("SELECT n FROM Note n JOIN FETCH n.createdBy WHERE n.id IN :ids AND n.deletedAt IS NULL")
    List<Note> findAllByIdInAndDeletedAtIsNull(@Param("ids") List<UUID> ids);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                UPDATE Note n
                SET n.deletedAt = CURRENT_TIMESTAMP
                WHERE n.id IN (
                    SELECT nm.note.id
                    FROM NoteMember nm
                    WHERE nm.member.id = :memberId
                      AND nm.role = com.synapse.api.modules.note.entity.NoteRole.OWNER
                      AND nm.deletedAt IS NULL
                )
                  AND n.deletedAt IS NULL
            """)
    void softDeleteOwnedNotesByMemberId(@Param("memberId") UUID memberId);

}