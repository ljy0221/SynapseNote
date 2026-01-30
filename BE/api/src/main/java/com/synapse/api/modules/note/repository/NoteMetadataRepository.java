package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NoteMetadataRepository extends JpaRepository<Note, UUID> {
    List<Note> findByCreatedById(UUID memberId);

    @Query("SELECT n FROM Note n WHERE n.createdBy.id = :memberId AND n.title LIKE %:query%")
    List<Note> searchByMemberAndQuery(@Param("memberId") UUID memberId, @Param("query") String query);
}