package com.synapse.api.modules.mindmap.service;

import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;
import com.synapse.api.modules.mindmap.dto.NodePositionDto;
import com.synapse.api.modules.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.modules.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.modules.mindmap.dto.request.UpdateMindmapPositionsRequest;
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

    @Transactional
    public void addMindMapNode(UUID userId, @Valid AddMindmapNodeRequest request) {
        Note note = noteRepository.findById(request.noteId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validNoteOwner(userId, note);

        note.setMindMapNode(request.pointX(), request.pointY());
    }

    @Transactional
    public void addMindMapEdge(UUID userId, @Valid MindmapEdgeRequest request) {
        Note child = noteRepository.findById(request.child())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
        Note parent = noteRepository.findById(request.parent())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validNoteOwner(userId, child);
        validNoteOwner(userId, parent);

        MindmapEdge mindMapEdge = MindmapEdge.createMindMapEdge(child, parent);

        mindmapEdgeRepository.save(mindMapEdge);
    }

    @Transactional
    public void deleteNode(UUID userId, UUID nodeId) {
        mindmapEdgeRepository.deleteByTo_Id(nodeId);
        mindmapEdgeRepository.deleteByFrom_Id(nodeId);

        Note note = noteRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        validNoteOwner(userId, note);

        note.deleteNode();
    }

    @Transactional
    public void deleteMindmap(UUID userId) {
        mindmapEdgeRepository.deleteAllByUserId(userId);
        noteRepository.resetMindmapNodePositions(userId);
    }

    @Transactional
    public void deleteConnection(UUID userId, MindmapEdgeRequest request) {
        int deleted = mindmapEdgeRepository.deleteByUserAndEdge(
                userId,
                request.parent(),
                request.child());

        if (deleted == 0) {
            throw new BusinessException(ErrorCode.MINDMAP_EDGE_NOT_DELETABLE);
        }
    }

    public MindmapResponse getMindmap(UUID userId) {
        List<Note> notes = noteRepository.findMindMapNodesByUser(userId);
        List<MindmapEdge> edges = mindmapEdgeRepository.findAllByUser(userId);

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

    private static void validNoteOwner(UUID userId, Note note) {
        if (!note.getCreatedBy().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    @Transactional
    public void updateNodePositions(UUID userId, UpdateMindmapPositionsRequest request) {
        if (request.nodes() == null || request.nodes().isEmpty()) {
            return;
        }

        List<UUID> nodeIds = request.nodes().stream()
                .map(NodePositionDto::nodeId)
                .toList();

        List<Note> notes = noteRepository.findAllById(nodeIds);

        if (notes.size() != nodeIds.size()) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }

        for (Note note : notes) {
            validNoteOwner(userId, note);

            if (note.getPointX() == null || note.getPointY() == null) {
                throw new BusinessException(ErrorCode.NOTE_NOT_IN_MINDMAP);
            }
        }

        Map<UUID, NodePositionDto> positionMap = request.nodes().stream()
                .collect(Collectors.toMap(NodePositionDto::nodeId, dto -> dto));

        for (Note note : notes) {
            NodePositionDto dto = positionMap.get(note.getId());
            note.updatePosition(dto.x(), dto.y());
        }
    }
}
