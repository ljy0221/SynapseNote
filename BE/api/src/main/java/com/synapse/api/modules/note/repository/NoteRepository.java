package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    // 1. 기본 조회 (Soft Delete 적용: deletedAt이 null인 것만 조회)
    // * 주의: Entity 클래스에 @Where(clause = "deleted_at IS NULL") 설정이 있다면
    //   findById 등 기본 메서드도 자동으로 삭제된 걸 걸러줍니다.
    //   없다면 아래처럼 명시적으로 만들어야 합니다.
    Optional<Note> findByIdAndDeletedAtIsNull(UUID id);

    // 2. 내 노트 목록 조회 (특정 디렉토리 하위 조회 시 사용 가능)
    List<Note> findByCreatedByIdAndDeletedAtIsNull(UUID userId);

    // 3. 디렉토리별 조회 (탐색기 기능용)
    List<Note> findByCreatedByIdAndDirectoryPathAndDeletedAtIsNull(UUID userId, String directoryPath);

    // 4. 즐겨찾기 목록 조회
    List<Note> findByCreatedByIdAndFavoriteTrueAndDeletedAtIsNull(UUID userId);

    // 5. 검색 기능 (제목 기준)
    @Query("SELECT n FROM Note n " +
            "WHERE n.createdBy.id = :userId " +
            "AND n.title LIKE %:query% " +
            "AND n.deletedAt IS NULL")
    List<Note> searchByUserAndQuery(@Param("userId") UUID userId, @Param("query") String query);

    // 6. 중복 제목 검사 등 (같은 폴더 내 이름 중복 방지용)
    boolean existsByCreatedByIdAndDirectoryPathAndTitleAndDeletedAtIsNull(UUID userId, String directoryPath, String title);
}