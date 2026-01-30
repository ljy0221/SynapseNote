package com.synapse.api.modules.note.repository;

import com.synapse.api.modules.note.entity.Invitation;
import com.synapse.api.modules.note.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    @Query("SELECT i FROM Invitation i WHERE i.invitationToken = :token AND i.deletedAt IS NULL")
    Optional<Invitation> findByInvitationToken(@Param("token") UUID token);

    @Query("SELECT i FROM Invitation i WHERE i.note.id = :noteId AND i.deletedAt IS NULL")
    List<Invitation> findByNoteId(@Param("noteId") UUID noteId);

    @Query("SELECT i FROM Invitation i WHERE i.note.id = :noteId AND LOWER(i.invitedEmail) = LOWER(:email) AND i.status = :status AND i.deletedAt IS NULL")
    Optional<Invitation> findByNoteIdAndEmailAndStatus(
            @Param("noteId") UUID noteId,
            @Param("email") String email,
            @Param("status") InvitationStatus status
    );

    @Query("SELECT COUNT(i) > 0 FROM Invitation i WHERE i.note.id = :noteId AND LOWER(i.invitedEmail) = LOWER(:email) AND i.status = 'PENDING' AND i.deletedAt IS NULL")
    boolean existsPendingInvitationByNoteIdAndEmail(
            @Param("noteId") UUID noteId,
            @Param("email") String email
    );
}
