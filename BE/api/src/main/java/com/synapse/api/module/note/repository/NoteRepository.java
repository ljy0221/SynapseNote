package com.synapse.api.module.note.repository;

import com.synapse.api.module.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    List<Note> findByCreatedById(UUID userId);

    @Query("SELECT n FROM Note n WHERE n.title ILIKE %:query%")
    List<Note> searchByTitle(@Param("query") String query);

    @Query("SELECT n FROM Note n WHERE n.createdBy.id = :userId " +
            "AND (n.title ILIKE %:query% OR n.directoryPath ILIKE %:query%)")
    List<Note> searchByUserAndQuery(@Param("userId") UUID userId, @Param("query") String query);
}
