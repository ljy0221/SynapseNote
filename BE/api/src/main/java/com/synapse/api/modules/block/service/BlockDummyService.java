package com.synapse.api.modules.block.service;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.member.dto.oauth.OAuthProvider;
import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.member.entity.OAuthAccount;
import com.synapse.api.modules.member.repository.MemberRepository;
import com.synapse.api.modules.member.repository.OAuthRepository;
import com.synapse.api.modules.note.dto.request.NoteCreateRequest;
import com.synapse.api.modules.note.dto.response.NoteResponse;
import com.synapse.api.modules.note.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class BlockDummyService {

    private final MemberRepository memberRepository;
    private final OAuthRepository oAuthRepository;
    private final BlockRepository blockRepository;
    private final NoteService noteService;

    @Transactional
    public UUID initBinarySearchDocument() {
        UUID memberId = createDummyMemberOrGet();
        UUID noteId = createNote(memberId);

        List<BaseBlock> blocks = new ArrayList<>();

        // 1) TextBlock - 옵션 다 있음
        blocks.add(TextBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(1.0)
                .properties(TextBlock.TextProperties.builder()
                        .content("""
                                # 이진 탐색(Binary Search)
                                
                                이진 탐색은 **정렬된 데이터 집합**에서 특정 값을 빠르게 찾기 위한 탐색 알고리즘이다.
                                매 단계에서 탐색 구간을 절반으로 줄이기 때문에, 데이터가 커질수록 선형 탐색보다 훨씬 효율적이다.
                                
                                이 문서는 이진 탐색의 전제 조건, 동작 방식, 시간 복잡도, 그리고 구현 시 주의사항을 정리한다.
                                """)
                        .attributes(Map.of(
                                "align", "LEFT",
                                "backgroundColor", "#FFFFFF",
                                "textColor", "#1F2937"))
                        .build())
                .build());

        // 2) TextBlock - attributes 일부만, 혹은 null
        // (AI 테스트를 위해 문서 톤으로 작성 + 옵션 null 케이스)
        blocks.add(TextBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(2.0)
                .properties(TextBlock.TextProperties.builder()
                        .content("""
                                ## 전제 조건
                                
                                이진 탐색이 올바르게 동작하려면 데이터가 반드시 **정렬**되어 있어야 한다.
                                정렬 기준이 오름차순인지 내림차순인지에 따라 비교 방향이 달라지며,
                                정렬 기준과 탐색 로직이 불일치하면 원하는 값을 찾지 못한다.
                                
                                또한 이진 탐색은 중간 인덱스로 즉시 접근해야 효율적이므로,
                                배열/ArrayList처럼 **임의 접근(Random Access)** 이 가능한 구조가 적합하다.
                                """)
                        .attributes(null) // null 케이스
                        .build())
                .build());

        // 3) TextBlock - 리스트/절차 중심, attributes 일부만
        blocks.add(TextBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(3.0)
                .properties(TextBlock.TextProperties.builder()
                        .content("""
                                ## 동작 방식
                                
                                이진 탐색은 항상 현재 탐색 구간의 가운데를 기준으로 판단한다.
                                
                                1. left(시작), right(끝) 인덱스를 잡는다.
                                2. mid = (left + right) / 2 를 계산한다.
                                3. arr[mid] 와 target 을 비교한다.
                                   - 같으면 탐색 성공
                                   - arr[mid] < target 이면 left = mid + 1
                                   - arr[mid] > target 이면 right = mid - 1
                                4. left > right 가 되면 탐색 실패로 종료한다.
                                
                                핵심은 **탐색 구간이 매 반복마다 절반으로 줄어든다**는 점이다.
                                """)
                        .attributes(Map.of(
                                "align", "LEFT",
                                "textColor", "#374151"
                                // backgroundColor는 일부러 생략 (옵션 다양화)
                        ))
                        .build())
                .build());

        // 4) CodeBlock - Java 구현 (properties 구조에 맞게)
        blocks.add(CodeBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(4.0)
                .properties(CodeBlock.CodeProperties.builder()
                        .language("java")
                        .version("17")
                        .executionMode("local") // 예: local / sandbox / docker 등(의미상)
                        .code("""
                                public static int binarySearch(int[] arr, int target) {
                                    int left = 0;
                                    int right = arr.length - 1;
                                
                                    while (left <= right) {
                                        // overflow 방지 패턴
                                        int mid = left + (right - left) / 2;
                                
                                        if (arr[mid] == target) return mid;
                                
                                        if (arr[mid] < target) {
                                            left = mid + 1;
                                        } else {
                                            right = mid - 1;
                                        }
                                    }
                                    return -1;
                                }
                                """)
                        .build())
                .build());

        // 5) CodeBlock - SQL 예시 (language null / version null 같은 케이스)
        blocks.add(CodeBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(5.0)
                .properties(CodeBlock.CodeProperties.builder()
                        .language(null) // null 케이스
                        .version(null) // null 케이스
                        .executionMode("readonly")
                        .code("""
                                -- 정렬된 인덱스를 활용하는 탐색은 DB에서도 매우 중요하다.
                                -- 예시: 특정 member_id의 노트를 최신순으로 조회
                                SELECT *
                                FROM notes
                                WHERE member_id = :memberId
                                ORDER BY created_at DESC
                                LIMIT 20;
                                """)
                        .build())
                .build());

        // 6) TextBlock - 시간복잡도 + 실무 주의사항, attributes 다른 조합
        blocks.add(TextBlock.builder()
                .noteId(noteId)
                .blockId(UUID.randomUUID())
                .ownerId(memberId)
                .order(6.0)
                .properties(TextBlock.TextProperties.builder()
                        .content("""
                                ## 시간 복잡도와 주의사항
                                
                                이진 탐색은 매 단계에서 탐색 범위를 절반으로 줄이므로 시간 복잡도는 **O(log N)** 이다.
                                반면, 선형 탐색은 최악의 경우 **O(N)** 이다.
                                
                                다만 실무에서는 다음을 같이 고려해야 한다.
                                
                                - 데이터가 자주 변경되는 상황에서는 “정렬 비용”이 누적될 수 있다.
                                - 연결 리스트처럼 임의 접근이 불가능한 구조에서는 이진 탐색이 비효율적이다.
                                - mid 계산을 (left + right) / 2 로 하면 overflow 위험이 있어
                                  left + (right - left) / 2 패턴을 권장한다.
                                
                                결론적으로, 이진 탐색은 “정렬 + 임의 접근”이 보장될 때 최고의 효율을 낸다.
                                """)
                        .attributes(Map.of(
                                "backgroundColor", "#F9FAFB",
                                "textColor", "#111827",
                                "align", "LEFT"))
                        .build())
                .build());

        blockRepository.saveAll(blocks);
        return noteId;
    }

    private UUID createDummyMemberOrGet() {
        return memberRepository.findByEmail("synapse.note@gmail.com")
                .map(Member::getId)
                .orElseGet(() -> {
                    Member saved = memberRepository.save(Member.builder()
                            .email("synapse.note@gmail.com")
                            .name("synapse")
                            .build());

                    oAuthRepository.save(OAuthAccount.builder()
                            .provider(OAuthProvider.GOOGLE)
                            .providerId("1234567890")
                            .member(saved)
                            .build());

                    return saved.getId();
                });
    }

    private UUID createNote(UUID memberId) {
        NoteCreateRequest request = NoteCreateRequest.builder()
                .title("이진 탐색")
                .directoryPath("/algorithms/search")
                .pointX(100.0)
                .pointY(200.0)
                .content("이진 탐색 알고리즘에 대한 설명과 예제 코드")
                .build();

        NoteResponse noteResponse = noteService.createNote(memberId, request);
        return noteResponse.noteId();
    }
}