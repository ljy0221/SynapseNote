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
import com.synapse.api.modules.member.entity.Member;
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

    private UUID memberId;
    private UUID noteId;
    private Member member;
    private Note note;

    @BeforeEach
    void setUp() {
        memberId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        member = Member.builder()
                .id(memberId)
                .email("test@example.com")
                .build();

        note = Note.builder()
                .id(noteId)
                .title("Test Note")
                .createdBy(member)
                .build();
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
                    .createdBy(member)
                    .build();
            note1.updatePosition(100.0, 200.0);

            Note note2 = Note.builder()
                    .id(note2Id)
                    .title("Note 2")
                    .createdBy(member)
                    .build();
            note2.updatePosition(300.0, 400.0);

            List<Note> notes = List.of(note1, note2);

            MindmapEdge edge = MindmapEdge.of(note1, note2);
            List<MindmapEdge> edges = List.of(edge);

            given(noteRepository.findMindMapNodesByMember(memberId)).willReturn(notes);
            given(mindmapEdgeRepository.findAllByMember(memberId)).willReturn(edges);

            // when
            MindmapResponse response = mindmapService.getMindmap(memberId);

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
    @DisplayName("syncMindmap 테스트")
    class SyncMindmapTest {

        @Test
        @DisplayName("노드 위치 업데이트 및 미포함 노드 제거")
        void syncMindmap_Nodes() {
            // given
            Note note1 = Note.builder().id(noteId).createdBy(member).build();
            note1.updatePosition(100.0, 200.0);

            UUID node2Id = UUID.randomUUID();
            Note note2 = Note.builder().id(node2Id).createdBy(member).build();
            note2.updatePosition(500.0, 600.0);

            given(noteRepository.findMindMapNodesByMember(memberId)).willReturn(List.of(note1, note2));

            NodePositionDto positionDto = new NodePositionDto(noteId, 150.0, 250.0);
            SyncMindmapRequest request = new SyncMindmapRequest(List.of(positionDto), null);

            given(noteRepository.findAllById(List.of(noteId))).willReturn(List.of(note1));

            // when
            mindmapService.syncMindmap(memberId, request);

            // then
            assertThat(note1.getPointX()).isEqualTo(150.0);
            assertThat(note1.getPointY()).isEqualTo(250.0);

            assertThat(note2.getPointX()).isNull();
            assertThat(note2.getPointY()).isNull();
        }

        @Test
        @DisplayName("엣지 동기화 (추가 및 삭제)")
        void syncMindmap_Edges() {
            // given
            UUID node1Id = UUID.randomUUID();
            UUID node2Id = UUID.randomUUID();
            UUID node3Id = UUID.randomUUID();

            Note note1 = Note.builder().id(node1Id).createdBy(member).build();
            Note note2 = Note.builder().id(node2Id).createdBy(member).build();
            Note note3 = Note.builder().id(node3Id).createdBy(member).build();

            MindmapEdge existingEdge = MindmapEdge.of(note1, note2);
            given(mindmapEdgeRepository.findAllByMember(memberId)).willReturn(List.of(existingEdge));

            MindmapEdgeDto edgeRequest = new MindmapEdgeDto(node1Id, node3Id);
            SyncMindmapRequest request = new SyncMindmapRequest(null, List.of(edgeRequest));

            given(noteRepository.findAllById(any())).willReturn(List.of(note1, note3));

            // when
            mindmapService.syncMindmap(memberId, request);

            // then
            then(mindmapEdgeRepository).should().deleteAll(any());
            then(mindmapEdgeRepository).should().saveAll(any());
        }
    }
}
