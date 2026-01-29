package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
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

    @Query("SELECT n FROM Note n WHERE n.createdBy.id = :userId AND n.deletedAt IS NULL")
    List<Note> findByCreatedById(@Param("userId") UUID userId);

    @Query("SELECT n FROM Note n WHERE n.id = :id AND n.deletedAt IS NULL")
    Optional<Note> findById(@Param("id") UUID id);

    @Query("SELECT n FROM Note n WHERE n.title ILIKE %:query% AND n.deletedAt IS NULL")
    List<Note> searchByTitle(@Param("query") String query);

    @Query("SELECT n FROM Note n WHERE n.createdBy.id = :userId " +
            "AND (n.title ILIKE %:query% OR n.directoryPath ILIKE %:query%) " +
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
}
