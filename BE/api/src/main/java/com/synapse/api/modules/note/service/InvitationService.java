package com.synapse.api.modules.note.service;

import com.github.f4b6a3.uuid.UuidCreator;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.note.dto.request.InvitationCreateRequest;
import com.synapse.api.modules.note.dto.response.InvitationAcceptResponse;
import com.synapse.api.modules.note.dto.response.InvitationResponse;
import com.synapse.api.modules.note.entity.*;
import com.synapse.api.modules.note.repository.InvitationRepository;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final MemberRepository memberRepository;

    @Value("${app.invitation.expiration-days:7}")
    private int expirationDays;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    /**
     * 초대 생성
     * - OWNER만 가능
     * - OWNER 역할로는 초대 불가
     */
    @Transactional
    public InvitationResponse createInvitation(UUID noteId, UUID memberId, InvitationCreateRequest request) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. OWNER 권한 확인
        validateOwnership(note, memberId);

        // 3. OWNER 역할 초대 불가
        if (request.role() == NoteRole.OWNER) {
            throw new BusinessException(ErrorCode.INVITATION_OWNER_NOT_ALLOWED);
        }

        // 4. 이미 멤버인지 확인 (이메일로 조회)
        Member existingMember = memberRepository.findByEmail(request.invitedEmail()).orElse(null);
        if (existingMember != null) {
            boolean isMember = noteMemberRepository.existsByNoteIdAndMemberId(noteId, existingMember.getId());
            if (isMember) {
                throw new BusinessException(ErrorCode.ALREADY_NOTE_MEMBER);
            }
        }

        // 5. 동일 이메일로 PENDING 상태 초대가 있는지 확인
        boolean hasPendingInvitation = invitationRepository.existsPendingInvitationByNoteIdAndEmail(
                noteId, request.invitedEmail());
        if (hasPendingInvitation) {
            throw new BusinessException(ErrorCode.INVITATION_ALREADY_EXISTS);
        }

        // 6. 초대 생성
        Member inviter = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        UUID invitationToken = UuidCreator.getTimeOrderedEpoch();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(expirationDays);

        Invitation invitation = Invitation.builder()
                .invitationToken(invitationToken)
                .note(note)
                .invitedBy(inviter)
                .invitedEmail(request.invitedEmail())
                .role(request.role())
                .status(InvitationStatus.PENDING)
                .expiresAt(expiresAt)
                .build();

        Invitation savedInvitation = invitationRepository.save(invitation);

        log.info("Created invitation: {} for email: {} to note: {} by member: {}",
                savedInvitation.getId(), request.invitedEmail(), noteId, memberId);

        return InvitationResponse.from(savedInvitation, frontendBaseUrl);
    }

    /**
     * 초대 수락
     * - 초대받은 이메일과 로그인 이메일 일치 확인
     * - 만료 확인
     */
    @Transactional
    public InvitationAcceptResponse acceptInvitation(UUID token, UUID memberId) {
        // 1. 초대 조회
        Invitation invitation = invitationRepository.findByInvitationToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));

        // 2. PENDING 상태 확인
        if (!invitation.isPending()) {
            throw new BusinessException(ErrorCode.INVITATION_NOT_ACCEPTABLE);
        }

        // 3. 만료 확인
        if (invitation.isExpired()) {
            invitation.expire();
            throw new BusinessException(ErrorCode.INVITATION_EXPIRED);
        }

        // 4. 사용자 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 5. 이메일 일치 확인 (대소문자 무시)
        if (!member.getEmail().equalsIgnoreCase(invitation.getInvitedEmail())) {
            throw new BusinessException(ErrorCode.INVITATION_EMAIL_MISMATCH);
        }

        // 6. 이미 멤버인지 확인
        boolean isMember = noteMemberRepository.existsByNoteIdAndMemberId(
                invitation.getNote().getId(), memberId);
        if (isMember) {
            throw new BusinessException(ErrorCode.ALREADY_NOTE_MEMBER);
        }

        // 7. NoteMember 생성
        NoteMemberId noteMemberId = new NoteMemberId(invitation.getNote().getId(), memberId);
        NoteMember noteMember = NoteMember.builder()
                .id(noteMemberId)
                .note(invitation.getNote())
                .member(member)
                .role(invitation.getRole())
                .build();
        noteMemberRepository.save(noteMember);

        // 8. 초대 수락 처리
        invitation.accept(member);

        log.info("Member: {} accepted invitation: {} for note: {}",
                memberId, invitation.getId(), invitation.getNote().getId());

        return InvitationAcceptResponse.from(invitation);
    }

    /**
     * OWNER 권한 검증
     */
    private void validateOwnership(Note note, UUID memberId) {
        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.INVITATION_ONLY_OWNER);
        }
    }
}
