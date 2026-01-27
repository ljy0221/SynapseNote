package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.document.NoteContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteContentRepository extends MongoRepository<NoteContent, String> {

    @Query("{ 'noteId': ?0, 'deletedAt': null }")
    Optional<NoteContent> findByNoteId(String noteId);

    @Query("{ 'deletedAt': null }")
    List<NoteContent> findAll();

    void deleteByNoteId(String noteId);

    boolean existsByNoteId(String noteId);
}
