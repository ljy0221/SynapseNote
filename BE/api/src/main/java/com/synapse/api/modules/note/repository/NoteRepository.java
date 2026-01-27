package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
