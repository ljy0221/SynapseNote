package com.synapse.api.modules.note.service;

import com.github.f4b6a3.uuid.UuidCreator;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.note.dto.request.InvitationCreateRequest;
import com.synapse.api.modules.note.dto.response.InvitationAcceptResponse;
import com.synapse.api.modules.note.dto.response.InvitationListResponse;
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
import java.util.List;
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

        // 4. 이미 멤버인지 확인 (이메일로 조회) - 이메일이 있는 경우만
        if (request.invitedEmail() != null) {
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

        // 5. 이메일 일치 확인 (대소문자 무시) - 초대된 이메일이 있는 경우만
        if (invitation.getInvitedEmail() != null && !member.getEmail().equalsIgnoreCase(invitation.getInvitedEmail())) {
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
     * 초대 링크를 통한 가입 요청
     * - 공개 링크(이메일 없는 초대)를 통해 사용자가 가입 요청을 보냄
     * - REQUESTED 상태의 새로운 Invitation 생성
     */
    @Transactional
    public void requestJoin(UUID token, UUID memberId) {
        // 1. 원본 초대(링크) 확인
        Invitation linkInvitation = invitationRepository.findByInvitationToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));

        // 2. 만료 확인
        if (linkInvitation.isExpired()) {
            throw new BusinessException(ErrorCode.INVITATION_EXPIRED);
        }

        // 3. 사용자 조회
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 4. 이미 멤버인지 확인
        if (noteMemberRepository.existsByNoteIdAndMemberId(linkInvitation.getNote().getId(), memberId)) {
            throw new BusinessException(ErrorCode.ALREADY_NOTE_MEMBER);
        }

        // 5. 이미 대기중인 요청이 있는지 확인 (REQUESTED 상태)
        // 같은 노트, 같은 멤버로 REQUESTED 상태인 초대가 있는지 확인해야 함
        // Invitation 엔티티에 invitedMember가 있으므로 이를 활용
        boolean alreadyRequested = invitationRepository
                .findByNoteIdAndStatus(linkInvitation.getNote().getId(), InvitationStatus.REQUESTED).stream()
                .anyMatch(inv -> inv.getInvitedMember() != null && inv.getInvitedMember().getId().equals(memberId));

        if (alreadyRequested) {
            throw new BusinessException(ErrorCode.INVITATION_ALREADY_EXISTS);
        }

        // 6. 가입 요청 생성 (REQUESTED)
        Invitation requestInvitation = Invitation.builder()
                .invitationToken(UuidCreator.getTimeOrderedEpoch()) // 별도 토큰 생성 (필요시)
                .note(linkInvitation.getNote())
                .invitedBy(linkInvitation.getInvitedBy()) // 원본 링크 생성자가 초대한 것으로 간주? 아니면 시스템? 원본 링크 생성자로 유지
                .invitedMember(member) // 요청한 사람
                .invitedEmail(member.getEmail())
                .role(linkInvitation.getRole()) // 기본 역할은 링크의 역할 따름 (보통 EDITOR)
                .status(InvitationStatus.REQUESTED)
                .expiresAt(LocalDateTime.now().plusDays(expirationDays))
                .build();

        invitationRepository.save(requestInvitation);
    }

    /**
     * 가입 요청 승인
     * - OWNER만 가능
     */
    @Transactional
    public void approveJoin(UUID invitationId, UUID ownerId) {
        // 1. 요청 조회
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITATION_NOT_FOUND));

        // 2. REQUESTED 상태 확인
        if (invitation.getStatus() != InvitationStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.INVITATION_NOT_ACCEPTABLE);
        }

        // 3. OWNER 권한 확인
        validateOwnership(invitation.getNote(), ownerId);

        // 4. 멤버 추가
        Member member = invitation.getInvitedMember();
        if (member == null) {
            // 방어 로직: 멤버가 없으면 이메일로 찾아야 하나, REQUESTED는 멤버가 있어야 함
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        NoteMemberId noteMemberId = new NoteMemberId(invitation.getNote().getId(), member.getId());
        NoteMember noteMember = NoteMember.builder()
                .id(noteMemberId)
                .note(invitation.getNote())
                .member(member)
                .role(invitation.getRole())
                .build();
        noteMemberRepository.save(noteMember);

        // 5. 승인 처리
        invitation.accept(member);
    }

    /**
     * PENDING 상태 초대 목록 조회
     * - OWNER만 가능
     */
    public InvitationListResponse getPendingInvitations(UUID noteId, UUID memberId) {
        // 1. 노트 존재 확인
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 2. OWNER 권한 확인
        validateOwnership(note, memberId);

        // 3. PENDING 상태 초대 목록 조회
        List<Invitation> invitations = invitationRepository.findByNoteIdAndStatus(
                noteId, InvitationStatus.PENDING);

        // 4. DTO 변환
        List<InvitationResponse> responses = invitations.stream()
                .map(inv -> InvitationResponse.from(inv, frontendBaseUrl))
                .toList();

        log.info("Retrieved {} pending invitations for note: {}", responses.size(), noteId);
        return InvitationListResponse.from(responses);
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
