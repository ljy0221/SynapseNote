package com.synapse.api.modules.mindmap.service;

import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;
import com.synapse.api.modules.mindmap.dto.NodePositionDto;

import com.synapse.api.modules.mindmap.dto.request.SyncMindmapRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.mindmap.entity.MindmapNodePosition;
import com.synapse.api.modules.mindmap.entity.MindmapNodePositionId;
import com.synapse.api.modules.mindmap.repository.MindmapEdgeRepository;
import com.synapse.api.modules.mindmap.repository.MindmapNodePositionRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.note.service.NoteValidator;
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
    private MindmapNodePositionRepository mindmapNodePositionRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private NoteValidator noteValidator;

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
            // Test에서 Position Repository에 데이터 세팅 필요 (Inner Join을 Mocking하거나, Repo Mocking)
            // getMindmap 로직: NoteRepo -> List<Note>, MindmapNodePositionRepo ->
            // List<MindmapNodePosition>
            // Note는 Mock으로 리턴되지만 Point 정보는 Position에서 옴.

            MindmapNodePosition pos1 = MindmapNodePosition.builder()
                    .id(new MindmapNodePositionId(memberId, note1Id))
                    .pointX(100.0).pointY(200.0).build();

            Note note2 = Note.builder()
                    .id(note2Id)
                    .title("Note 2")
                    .createdBy(member)
                    .build();

            MindmapNodePosition pos2 = MindmapNodePosition.builder()
                    .id(new MindmapNodePositionId(memberId, note2Id))
                    .pointX(300.0).pointY(400.0).build();

            List<Note> notes = List.of(note1, note2);

            MindmapEdge edge = MindmapEdge.of(note1, note2, member);
            List<MindmapEdge> edges = List.of(edge);

            given(noteRepository.findMindMapNodesByMember(memberId)).willReturn(notes);
            given(mindmapEdgeRepository.findAllByMember(memberId)).willReturn(edges);
            given(mindmapNodePositionRepository.findAllByIdMemberId(memberId)).willReturn(List.of(pos1, pos2));

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
        @DisplayName("노드 위치 업데이트 (개인 위치 저장)")
        void syncMindmap_Nodes() {
            // given
            // Note에는 기본 위치가 있지만, syncMindmap은 MindmapNodePosition을 업데이트해야 함
            // Note에는 기본 위치가 없음
            Note note1 = Note.builder().id(noteId).createdBy(member).build();

            given(mindmapNodePositionRepository.findAllByIdMemberId(memberId)).willReturn(List.of());

            NodePositionDto positionDto = new NodePositionDto(noteId, 150.0, 250.0);
            SyncMindmapRequest request = new SyncMindmapRequest(List.of(positionDto), null);

            given(noteRepository.findAllById(List.of(noteId))).willReturn(List.of(note1));

            // when
            mindmapService.syncMindmap(memberId, request);

            // then
            // then
            // note1 객체 검증 대신 interaction 검증
            // assertThat(note1.getPointX()).isEqualTo(100.0); // 삭제된 필드 검증 불가

            // mindmapNodePositionRepository에 저장이 호출됨을 검증
            then(mindmapNodePositionRepository).should().saveAll(any());

            // note2는 요청에 없으므로 삭제 대상? -> 기존 위치 정보가 없었으므로 아무 일도 안 일어남.
            // 만약 기존 위치 정보가 있었다면 delete 호출됨.
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

            MindmapEdge existingEdge = MindmapEdge.of(note1, note2, member);
            given(mindmapEdgeRepository.findAllByMember(memberId)).willReturn(List.of(existingEdge));

            MindmapEdgeDto edgeRequest = new MindmapEdgeDto(node1Id, node3Id);
            SyncMindmapRequest request = new SyncMindmapRequest(null, List.of(edgeRequest));

            given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
            given(noteRepository.findAllById(any())).willReturn(List.of(note1, note3));

            // when
            mindmapService.syncMindmap(memberId, request);

            // then
            then(mindmapEdgeRepository).should().deleteAll(any());
            then(mindmapEdgeRepository).should().saveAll(any());
        }
    }
}
