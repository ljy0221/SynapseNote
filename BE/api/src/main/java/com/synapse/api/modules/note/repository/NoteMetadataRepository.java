package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.document.NoteMetadata;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteMetadataRepository extends MongoRepository<NoteMetadata, String> {

    @Query("{ 'noteId': ?0, 'deletedAt': null }")
    Optional<NoteMetadata> findByNoteId(String noteId);

    @Query("{ 'deletedAt': null }")
    List<NoteMetadata> findAll();

    void deleteByNoteId(String noteId);

    boolean existsByNoteId(String noteId);
}