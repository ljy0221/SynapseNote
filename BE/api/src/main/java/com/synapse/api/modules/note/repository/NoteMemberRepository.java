package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.entity.NoteMember;
import com.synapse.api.modules.note.entity.NoteMemberId;
import com.synapse.api.modules.note.entity.NoteRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteMemberRepository extends JpaRepository<NoteMember, NoteMemberId> {

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.userId = :userId AND nm.deletedAt IS NULL")
    List<NoteMember> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.deletedAt IS NULL")
    List<NoteMember> findByNoteId(@Param("noteId") UUID noteId);

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId AND nm.deletedAt IS NULL")
    Optional<NoteMember> findByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);

    @Query("SELECT nm.role FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId AND nm.deletedAt IS NULL")
    Optional<NoteRole> findRoleByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(nm) > 0 FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId AND nm.deletedAt IS NULL")
    boolean existsByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);
}
