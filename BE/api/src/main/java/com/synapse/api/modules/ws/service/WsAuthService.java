package com.synapse.api.modules.ws.service;

import com.synapse.api.modules.note.repository.NoteMemberRepository;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.ws.dto.request.WsAuthRequest;
import com.synapse.api.modules.ws.dto.response.WsAuthResponse;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import com.synapse.api.util.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

import static com.synapse.api.util.Constant.TICKET_TTL;

@Service
@RequiredArgsConstructor
public class WsAuthService {

    private final NoteRepository noteRepository;
    private final NoteMemberRepository noteMemberRepository;
    private final JwtUtil jwtUtil;

    public WsAuthResponse issueTicket(UUID userId, WsAuthRequest request) {
        UUID noteId = request.noteId();

        noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        noteMemberRepository.findByNoteIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_ACCESS_DENIED));

        Instant expiresAt = Instant.now().plus(TICKET_TTL);

        String ticket = jwtUtil.generateTicket(userId, noteId, expiresAt);

        return WsAuthResponse.builder()
                .ticket(ticket)
                .build();
    }

}

