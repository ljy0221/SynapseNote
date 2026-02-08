package com.synapse.api.modules.webrtc.service;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebRtcService {

    private final NoteMemberRepository noteMemberRepository;

    @Transactional(readOnly = true)
    public String validateAndGetMemberName(UUID noteId, UUID memberId) {
        Member member = noteMemberRepository.findByNoteIdAndMemberId(noteId, memberId)
                .map(com.synapse.api.modules.note.entity.NoteMember::getMember)
                .orElseThrow(() -> {
                    log.warn("Access denied: Member {} is not a participant of Note {}", memberId, noteId);
                    return new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
                });

        return member.getName();
    }
}
