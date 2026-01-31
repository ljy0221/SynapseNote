package com.synapse.api.modules.mindmap.service;

import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;
import com.synapse.api.modules.mindmap.dto.NodePositionDto;

import com.synapse.api.modules.mindmap.dto.request.SyncMindmapRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
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

    private void addMindMapEdge(UUID memberId, @Valid MindmapEdgeDto request) {
        Note child = noteRepository.findById(request.fromId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        Note parent = noteRepository.findById(request.toId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validNoteOwner(memberId, child);
        validNoteOwner(memberId, parent);

        MindmapEdge mindMapEdge = MindmapEdge.of(child, parent);

        mindmapEdgeRepository.save(mindMapEdge);
    }

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

    private static void validNoteOwner(UUID memberId, Note note) {
        if (!note.getCreatedBy().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    @Transactional
    public void syncMindmap(UUID memberId, SyncMindmapRequest request) {
        if (request.nodes() != null && !request.nodes().isEmpty()) {
            List<UUID> nodeIds = request.nodes().stream()
                    .map(NodePositionDto::nodeId)
                    .toList();

            List<Note> notes = noteRepository.findAllById(nodeIds);

            if (notes.size() != nodeIds.size()) {
                throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
            }

            Map<UUID, NodePositionDto> positionMap = request.nodes().stream()
                    .collect(Collectors.toMap(NodePositionDto::nodeId, dto -> dto));

            for (Note note : notes) {
                validNoteOwner(memberId, note);

                NodePositionDto dto = positionMap.get(note.getId());
                note.updatePosition(dto.x(), dto.y());
            }
        }

        if (request.edges() != null) {
            syncEdges(memberId, request.edges());
        }
    }

    private void syncEdges(UUID memberId, List<MindmapEdgeDto> requestedEdges) {
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

            for (MindmapEdgeDto req : edgesToAdd) {
                addMindMapEdge(memberId, req);
            }
        }
    }
}
