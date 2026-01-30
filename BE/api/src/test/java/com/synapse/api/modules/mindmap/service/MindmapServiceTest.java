package com.synapse.api.modules.mindmap.service;

import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;
import com.synapse.api.modules.mindmap.dto.NodePositionDto;
import com.synapse.api.modules.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.modules.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.modules.mindmap.dto.request.UpdateMindmapPositionsRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
@DisplayName("MindmapService 단위 테스트")
class MindmapServiceTest {

    @Mock
    private MindmapEdgeRepository mindmapEdgeRepository;

    @Mock
    private NoteRepository noteRepository;

    @InjectMocks
    private MindmapService mindmapService;

    private UUID userId;
    private UUID noteId;
    private User user;
    private Note note;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("test@example.com")
                .build();

        note = Note.builder()
                .id(noteId)
                .title("Test Note")
                .createdBy(user)
                .build();
    }

    @Nested
    @DisplayName("addMindMapNode 테스트")
    class AddMindMapNodeTest {

        @Test
        @DisplayName("노트를 마인드맵 노드로 추가")
        void addMindMapNode() {
            // given
            Double pointX = 100.0;
            Double pointY = 200.0;
            AddMindmapNodeRequest request = new AddMindmapNodeRequest(pointX, pointY, noteId);

            given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

            // when
            mindmapService.addMindMapNode(userId, request);

            // then
            then(noteRepository).should().findById(noteId);
            assertThat(note.getPointX()).isEqualTo(pointX);
            assertThat(note.getPointY()).isEqualTo(pointY);
        }
    }

    @Nested
    @DisplayName("addMindMapEdge 테스트")
    class AddMindMapEdgeTest {

        private UUID parentId;
        private UUID childId;
        private Note parentNote;
        private Note childNote;

        @BeforeEach
        void setUp() {
            parentId = UUID.randomUUID();
            childId = UUID.randomUUID();

            parentNote = Note.builder()
                    .id(parentId)
                    .title("Parent Note")
                    .createdBy(user)
                    .build();

            childNote = Note.builder()
                    .id(childId)
                    .title("Child Note")
                    .createdBy(user)
                    .build();
        }

        @Test
        @DisplayName("마인드맵 엣지 추가")
        void addMindMapEdge() {
            // given
            MindmapEdgeRequest request = new MindmapEdgeRequest(parentId, childId);
            given(noteRepository.findById(childId)).willReturn(Optional.of(childNote));
            given(noteRepository.findById(parentId)).willReturn(Optional.of(parentNote));

            // when
            mindmapService.addMindMapEdge(userId, request);

            // then
            then(mindmapEdgeRepository).should().save(any(MindmapEdge.class));
        }
    }

    @Nested
    @DisplayName("deleteNode 테스트")
    class DeleteNodeTest {

        @Test
        @DisplayName("노드 삭제 시 연결된 엣지도 삭제되고 좌표가 null로 변경됨")
        void deleteNode() {
            // given
            note.updatePosition(100.0, 200.0);
            given(noteRepository.findById(noteId)).willReturn(Optional.of(note));

            // when
            mindmapService.deleteNode(userId, noteId);

            // then
            then(mindmapEdgeRepository).should().deleteByTo_Id(noteId);
            then(mindmapEdgeRepository).should().deleteByFrom_Id(noteId);
            assertThat(note.getPointX()).isNull();
            assertThat(note.getPointY()).isNull();
        }
    }

    @Nested
    @DisplayName("deleteMindmap 테스트")
    class DeleteMindmapTest {

        @Test
        @DisplayName("마인드맵 전체 삭제 시 모든 엣지 삭제 및 노드 좌표 초기화")
        void deleteMindmap() {
            // given
            given(mindmapEdgeRepository.deleteAllByUserId(userId)).willReturn(5);
            given(noteRepository.resetMindmapNodePositions(userId)).willReturn(3);

            // when
            mindmapService.deleteMindmap(userId);

            // then
            then(mindmapEdgeRepository).should().deleteAllByUserId(userId);
            then(noteRepository).should().resetMindmapNodePositions(userId);
        }
    }

    @Nested
    @DisplayName("deleteConnection 테스트")
    class DeleteConnectionTest {

        @Test
        @DisplayName("특정 연결 삭제")
        void deleteConnection() {
            // given
            UUID parentId = UUID.randomUUID();
            UUID childId = UUID.randomUUID();
            MindmapEdgeRequest request = new MindmapEdgeRequest(parentId, childId);
            given(mindmapEdgeRepository.deleteByUserAndEdge(userId, parentId, childId)).willReturn(1);

            // when
            mindmapService.deleteConnection(userId, request);

            // then
            then(mindmapEdgeRepository).should().deleteByUserAndEdge(userId, parentId, childId);
        }
    }

    @Nested
    @DisplayName("getMindmap 테스트")
    class GetMindmapTest {

        @Test
        @DisplayName("마인드맵 조회")
        void getMindmap() {
            // given
            UUID note1Id = UUID.randomUUID();
            UUID note2Id = UUID.randomUUID();

            Note note1 = Note.builder()
                    .id(note1Id)
                    .title("Note 1")
                    .createdBy(user)
                    .build();
            note1.updatePosition(100.0, 200.0);

            Note note2 = Note.builder()
                    .id(note2Id)
                    .title("Note 2")
                    .createdBy(user)
                    .build();
            note2.updatePosition(300.0, 400.0);

            List<Note> notes = List.of(note1, note2);

            MindmapEdge edge = MindmapEdge.createMindMapEdge(note1, note2);
            List<MindmapEdge> edges = List.of(edge);

            given(noteRepository.findMindMapNodesByUser(userId)).willReturn(notes);
            given(mindmapEdgeRepository.findAllByUser(userId)).willReturn(edges);

            // when
            MindmapResponse response = mindmapService.getMindmap(userId);

            // then
            assertThat(response.nodes()).hasSize(2);
            assertThat(response.edges()).hasSize(1);

            MindmapNodeDto node1 = response.nodes().get(0);
            assertThat(node1.id()).isEqualTo(note1Id);
            assertThat(node1.title()).isEqualTo("Note 1");
            assertThat(node1.x()).isEqualTo(100.0);
            assertThat(node1.y()).isEqualTo(200.0);
            assertThat(node1.priority()).isEqualTo(1);

            MindmapEdgeDto edgeDto = response.edges().get(0);
            assertThat(edgeDto.fromId()).isEqualTo(note1Id);
            assertThat(edgeDto.toId()).isEqualTo(note2Id);
        }
    }

    @Nested
    @DisplayName("updateNodePositions 테스트")
    class UpdateNodePositionsTest {

        @Test
        @DisplayName("노드 위치 업데이트")
        void updateNodePositions() {
            // given
            note.updatePosition(100.0, 200.0);
            NodePositionDto positionDto = new NodePositionDto(noteId, 150.0, 250.0);
            UpdateMindmapPositionsRequest request = new UpdateMindmapPositionsRequest(List.of(positionDto));

            given(noteRepository.findAllById(List.of(noteId))).willReturn(List.of(note));

            // when
            mindmapService.updateNodePositions(userId, request);

            // then
            assertThat(note.getPointX()).isEqualTo(150.0);
            assertThat(note.getPointY()).isEqualTo(250.0);
        }
    }
}
