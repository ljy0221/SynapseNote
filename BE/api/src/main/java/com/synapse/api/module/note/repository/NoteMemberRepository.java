package com.synapse.api.module.note.repository;

import com.synapse.api.module.note.entity.NoteMember;
import com.synapse.api.module.note.entity.NoteMemberId;
import com.synapse.api.module.note.entity.NoteRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteMemberRepository extends JpaRepository<NoteMember, NoteMemberId> {

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.userId = :userId")
    List<NoteMember> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.noteId = :noteId")
    List<NoteMember> findByNoteId(@Param("noteId") UUID noteId);

    @Query("SELECT nm FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId")
    Optional<NoteMember> findByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);

    @Query("SELECT nm.role FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId")
    Optional<NoteRole> findRoleByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(nm) > 0 FROM NoteMember nm WHERE nm.id.noteId = :noteId AND nm.id.userId = :userId")
    boolean existsByNoteIdAndUserId(@Param("noteId") UUID noteId, @Param("userId") UUID userId);
}
