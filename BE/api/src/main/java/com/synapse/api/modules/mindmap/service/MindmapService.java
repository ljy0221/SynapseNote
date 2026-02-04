package com.synapse.api.modules.mindmap.service;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;
import com.synapse.api.modules.mindmap.dto.NodePositionDto;

import com.synapse.api.modules.mindmap.dto.request.SyncMindmapRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.note.service.NoteValidator;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MindmapService {
    private final MindmapEdgeRepository mindmapEdgeRepository;
    private final NoteRepository noteRepository;
    private final MemberRepository memberRepository;
    private final NoteValidator noteValidator;

    public MindmapResponse getMindmap(UUID memberId) {
        List<Note> notes = noteRepository.findMindMapNodesByMember(memberId);
        List<MindmapEdge> edges = mindmapEdgeRepository.findAllByMember(memberId);

        Map<UUID, Long> fanoutMap = edges.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getFrom().getId(),
                        Collectors.counting()));

        List<MindmapNodeDto> nodeDtos = notes.stream()
                .map(n -> new MindmapNodeDto(
                        n.getId(),
                        n.getTitle(),
                        n.getPointX(),
                        n.getPointY(),
                        fanoutMap.getOrDefault(n.getId(), 0L).intValue(),
                        n.getDirectoryPath()))
                .toList();

        List<MindmapEdgeDto> edgeDtos = edges.stream()
                .map(e -> new MindmapEdgeDto(
                        e.getFrom().getId(),
                        e.getTo().getId()))
                .toList();

        return new MindmapResponse(nodeDtos, edgeDtos);
    }

    @Transactional
    public void syncMindmap(UUID memberId, SyncMindmapRequest request) {
        if (request.nodes() != null) {

            List<Note> currentMindmapNodes = noteRepository.findMindMapNodesByMember(memberId);
            Map<UUID, Note> currentNodeMap = currentMindmapNodes.stream()
                    .collect(Collectors.toMap(Note::getId, n -> n));

            if (!request.nodes().isEmpty()) {
                List<UUID> validNodeIds = request.nodes().stream()
                        .map(NodePositionDto::nodeId)
                        .toList();

                Map<UUID, NodePositionDto> requestNodeMap = request.nodes().stream()
                        .collect(Collectors.toMap(NodePositionDto::nodeId, dto -> dto));

                List<Note> requestedNotes = noteRepository.findAllById(validNodeIds);

                if (requestedNotes.size() != validNodeIds.size()) {
                    throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
                }

                for (Note note : requestedNotes) {
                    // [Modified] 소유자뿐만 아니라 공유받은 사용자도 마인드맵 편집 가능
                    noteValidator.validateAccess(note, memberId);
                    NodePositionDto dto = requestNodeMap.get(note.getId());
                    note.updatePosition(dto.x(), dto.y());

                    currentNodeMap.remove(note.getId());
                }
            }

            for (Note noteToRemove : currentNodeMap.values()) {
                noteToRemove.deleteNode();
            }
        }

        if (request.edges() != null) {
            syncEdges(memberId, request.edges());
        }
    }

    private void syncEdges(UUID memberId, List<MindmapEdgeDto> requestedEdges) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        List<MindmapEdge> existingEdges = mindmapEdgeRepository.findAllByMember(memberId);

        Map<String, MindmapEdge> existingEdgeMap = existingEdges.stream()
                .collect(Collectors.toMap(
                        e -> e.getFrom().getId().toString() + ":" + e.getTo().getId().toString(),
                        e -> e));

        Map<String, MindmapEdgeDto> requestedEdgeMap = requestedEdges.stream()
                .collect(Collectors.toMap(
                        e -> e.fromId().toString() + ":" + e.toId().toString(),
                        e -> e,
                        (e1, e2) -> e1));
        List<MindmapEdge> edgesToDelete = existingEdges.stream()
                .filter(e -> !requestedEdgeMap
                        .containsKey(e.getFrom().getId().toString() + ":" + e.getTo().getId().toString()))
                .toList();

        if (!edgesToDelete.isEmpty()) {
            mindmapEdgeRepository.deleteAll(edgesToDelete);
        }

        List<MindmapEdgeDto> edgesToAdd = requestedEdges.stream()
                .filter(e -> !existingEdgeMap.containsKey(e.fromId().toString() + ":" + e.toId().toString()))
                .toList();

        if (!edgesToAdd.isEmpty()) {
            java.util.Set<UUID> relatedNodeIds = java.util.stream.Stream.concat(
                    edgesToAdd.stream().map(MindmapEdgeDto::fromId),
                    edgesToAdd.stream().map(MindmapEdgeDto::toId)).collect(Collectors.toSet());

            Map<UUID, Note> relatedNotes = noteRepository.findAllById(relatedNodeIds).stream()
                    .collect(Collectors.toMap(Note::getId, n -> n));

            if (relatedNotes.size() != relatedNodeIds.size()) {
                throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
            }

            List<MindmapEdge> newEdges = new java.util.ArrayList<>();

            for (MindmapEdgeDto req : edgesToAdd) {
                Note child = relatedNotes.get(req.fromId());
                Note parent = relatedNotes.get(req.toId());

                // [Modified] 소유자뿐만 아니라 공유받은 사용자도 엣지 생성 가능
                noteValidator.validateAccess(child, memberId);
                noteValidator.validateAccess(parent, memberId);

                newEdges.add(MindmapEdge.of(child, parent, member));
            }

            mindmapEdgeRepository.saveAll(newEdges);
        }
    }

    /**
     * 노트 삭제 시 연결된 모든 엣지 삭제
     * 
     * @param noteId 삭제할 노트 ID
     */
    @Transactional
    public void deleteEdgesByNoteId(UUID noteId) {
        mindmapEdgeRepository.deleteByFrom_Id(noteId);
        mindmapEdgeRepository.deleteByTo_Id(noteId);
        log.debug("Deleted all mindmap edges connected to note: {}", noteId);
    }
}
