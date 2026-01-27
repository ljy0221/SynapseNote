package com.synapse.api.module.mindmap.service;

import com.synapse.api.module.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.module.mindmap.dto.MindmapNodeDto;
import com.synapse.api.module.mindmap.dto.NodePositionDto;
import com.synapse.api.module.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.module.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.module.mindmap.dto.request.UpdateMindmapPositionsRequest;
import com.synapse.api.module.mindmap.dto.response.MindmapResponse;
import com.synapse.api.module.mindmap.entity.MindmapEdge;
import com.synapse.api.module.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.module.note.entity.Note;
import com.synapse.api.module.note.repository.NoteRepository;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.exception.ErrorCode;
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

    /**
     * 특정 노드를 삭제 하면 모든 연결을 일괄 삭제하고
     * x, y 좌표까지 null로 변경해야함
     */
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
    }

    @Transactional
    public void deleteConnection(UUID userId, MindmapEdgeRequest request) {
        int deleted = mindmapEdgeRepository.deleteByUserAndEdge(
                userId,
                request.parent(),
                request.child()
        );

        if (deleted == 0) {
            //todo: 권한 없거나 연결이 존재하지않는다라는 예외로 바꾸기
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }
    }

    public MindmapResponse getMindmap(UUID userId) {
        List<Note> notes = noteRepository.findMindMapNodesByUser(userId);
        List<MindmapEdge> edges = mindmapEdgeRepository.findAllByUser(userId);

        Map<UUID, Long> fanoutMap = edges.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getFrom().getId(),
                        Collectors.counting()
                ));

        List<MindmapNodeDto> nodeDtos = notes.stream()
                .map(n -> new MindmapNodeDto(
                        n.getId(),
                        n.getTitle(),
                        n.getPointX(),
                        n.getPointY(),
                        fanoutMap.getOrDefault(n.getId(), 0L).intValue(),
                        n.getDirectoryPath()
                ))
                .toList();

        List<MindmapEdgeDto> edgeDtos = edges.stream()
                .map(e -> new MindmapEdgeDto(
                        e.getFrom().getId(),
                        e.getTo().getId()
                ))
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
                //todo: NOTE_NOT_IN_MINDMAP 예외로 바꾸기
                throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
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
