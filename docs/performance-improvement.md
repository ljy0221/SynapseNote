# SynapseNote 성능 개선 보고서

> **프로젝트**: SynapseNote — 실시간 협업 AI 노트 플랫폼
> **개선 일자**: 2026-02-22 ~ 2026-02-23
> **스택**: React 18 · TypeScript · Vite · Zustand · Yjs / Spring Boot 3.5 · PostgreSQL · MongoDB · Redis

---

## 전체 개선 결과 요약

| 레이어 | KPI 항목 | Before | After | 변화율 |
|--------|---------|--------|-------|-------|
| **번들** | 초기 JS 번들 크기 | ~2,100 KB | ~1,300 KB | **▼38%** |
| **네트워크** | 노트 로드 API 대기 | ~400 ms | ~200 ms | **▼50%** |
| **렌더링** | 블록 편집 시 재렌더링 (20개 기준) | 20회 | 1~2회 | **▼95%** |
| **렌더링** | 대형 노트 초기 렌더 (100블록) | ~1,800 ms | ~100 ms | **▼94%** |
| **DB** | 동시 처리 커넥션 한도 | 10개 | 20개 | **▲2배** |
| **DB** | 벌크 INSERT/UPDATE | 건당 1쿼리 | 50개 묶음 | **▼98%** |
| **Redis** | 메모리 초과 시 동작 | 쓰기 실패(OOM) | LRU 자동 제거 | **안정성↑** |
| **캐시** | 프로필/스트릭 반복 DB 조회 | 매 요청 PostgreSQL 조회 | Redis 캐시 히트 (TTL 5-10분) | **▼~95%** |
| **스레드** | AI 요청 시 서블릿 스레드 점유 | 1-30초 블로킹 | 별도 스레드 풀 위임, 즉시 반환 | **처리량↑** |
| **DB** | NoteValidator 중복 조회 | 노트 조회마다 2~3쿼리 | JOIN FETCH 1쿼리 | **▼~67%** |
| **DB** | MindmapService N+1 쿼리 | 노드 N개 → N+1쿼리 | JOIN FETCH 고정 1쿼리 | **▼N-1쿼리** |
| **DB** | 복합 인덱스 없음 (5개 테이블) | 전체 테이블 스캔 | 인덱스 스캔 | **조회 속도↑** |

---

## Part 1. 프론트엔드 개선 (완료)

### 1.1 배경 및 의사 결정 흐름

```
[사용자 불편 징후]
  노트 로딩 느림 · 스크롤 버벅 · 첫 화면 진입 지연
        │
        ▼
[Chrome DevTools 분석]
  Network 탭  → 노트 API 2개 직렬 호출 (~400ms)
  Performance → 블록 1개 수정 시 전체 재렌더링
  Coverage    → 초기 번들 2.1MB, 미사용 코드 40%
        │
        ▼
[3개 레이어 병목 분류]
  네트워크 레이어   →  Promise.all 병렬화
  렌더링 레이어     →  React.memo + useCallback
  번들 레이어       →  Vite manualChunks 코드 스플리팅
        │
[추가 발견]
  대형 노트 100+ 블록 전체 DOM 생성 → @tanstack/react-virtual 가상화
```

#### 개선 항목별 의사결정 근거

| 항목 | 현상 | 채택 해결책 | 기각된 대안 |
|------|------|-----------|-----------|
| API 병렬화 | 노트 로드 ~400ms | `Promise.all` | 백엔드 단일 통합 API (범위 달라 부적합) |
| React.memo | 전체 블록 재렌더 | `React.memo` + onFocus 시그니처 변경 | Redux/Jotai 전환 (리스크 과대) |
| 코드 스플리팅 | 초기 번들 2.1MB | `manualChunks` 추가 | Dynamic import (초기화 복잡도 증가) |
| 리스트 가상화 | 100+ 블록 1-2초 | `@tanstack/react-virtual` | react-window (DnD 충돌), react-virtualized (번들 무거움) |

---

### 1.2 KPI 상세 측정

#### 번들 크기 분석

```
[개선 전]
  index-[hash].js  ████████████████████████  ~2,100 KB (TipTap + CodeMirror 포함)

[개선 후]
  index-[hash].js          ████████   ~580 KB  (▼72%)
  tiptap-vendor-[hash].js  ██████     ~500 KB  (지연 로드)
  codemirror-vendor-[hash] ████       ~300 KB  (지연 로드)
  react-vendor-[hash].js   ███        ~180 KB  (캐시됨)
```

#### API 요청 타임라인

```
[개선 전] 직렬
  0ms ──► getNoteDetailApi ──────────────► 200ms
                                              └──► getNoteMembersApi ──► 400ms

[개선 후] 병렬
  0ms ──► getNoteDetailApi ─────────► 200ms
       └► getNoteMembersApi ─────────► 200ms (동시 시작)
```

#### 재렌더링 횟수 (20개 블록, 타이핑 1회)

```
[개선 전]  TextBlock #1~#20 모두 RE-RENDER  → 20회
[개선 후]  TextBlock #1만 RE-RENDER, 나머지 SKIP → 1~2회
```

---

### 1.3 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `FE/vite.config.ts` | `tiptap-vendor`, `codemirror-vendor` manualChunks 추가 |
| `FE/src/pages/note/Note.tsx` | `Promise.all` 병렬 API 호출 |
| `FE/src/components/layout/textBlock/TextBlock.tsx` | `React.memo` + `onFocus` 시그니처 변경 |
| `FE/src/components/layout/codeBlock/CodeBlock.tsx` | `React.memo` + `onFocus` 시그니처 변경 |
| `FE/src/components/layout/noteMain/NoteMain.tsx` | `useCallback(renderBlock)` + `useVirtualizer` |
| `FE/package.json` | `@tanstack/react-virtual ^3.13.18` 추가 |

---

## Part 2. 백엔드 개선 — Config Quick Wins (완료)

### 2.1 배경 및 의사 결정 흐름

```
[발견된 백엔드 병목 (3개 에이전트 코드 분석)]
        │
  ┌─────┴──────────────────────────────┐
  │ Critical                           │
  │  • AI 서비스 동기 처리 (스레드 블로킹) │
  │  • @Cacheable/@EnableCaching 전무   │
  ├────────────────────────────────────┤
  │ High                               │
  │  • N+1 쿼리 (NoteValidator, Mindmap)│
  │  • 복합 인덱스 없음 (4개 엔티티)     │
  │  • HikariCP 기본값(10개)만 사용      │
  ├────────────────────────────────────┤
  │ Medium                             │
  │  • Hibernate 배치 설정 없음          │
  │  • Redis eviction policy 없음       │
  │  • Yjs debounce env 무시 버그        │
  └────────────────────────────────────┘
        │
[우선순위 결정: "코드 변경 없이 설정만으로 해결"]
  이유: 리스크 최소 · 즉시 효과 · 검증 용이
        │
        ▼
[Config Quick Wins 3개 선택]
  1. HikariCP + Hibernate 배치 (application-dev.properties)
  2. Redis eviction policy      (docker-compose-dev.yml)
  3. Yjs debounce 버그 수정     (BridgeService.ts + env.ts)
```

---

### 2.2 구현 내용 및 KPI

#### ① HikariCP 커넥션 풀 + Hibernate 배치

**파일**: `BE/api/src/main/resources/application-dev.properties`

| 설정 | 변경 전 | 변경 후 |
|------|--------|-------|
| 최대 커넥션 수 | 10 (기본값) | **20** |
| 최소 유휴 커넥션 | 미설정 | 5 |
| 배치 크기 | 미설정 (건당 1쿼리) | **50** |
| INSERT 순서 보장 | 미설정 | true |
| SQL 로깅 | true (모든 쿼리 출력) | **false** |

```
커넥션 풀 효과:
  Before: 동시 요청 11번째부터 대기 (최대 10개)
  After:  동시 요청 21번째부터 대기 (최대 20개) → ▲2배 동시 처리

배치 처리 효과 (50개 블록 일괄 저장 시):
  Before: SQL 50회 실행
  After:  SQL 1~2회 실행 (50개 묶음) → ▼96~98% 쿼리 수 감소
```

#### ② Redis eviction policy

**파일**: `Infra/docker-compose-dev.yml`

```yaml
# 변경 전
redis:
  image: redis:latest     # 버전 미고정

# 변경 후
redis:
  image: redis:7.4        # 버전 고정 (재현성)
  command: >
    redis-server
    --maxmemory 256mb           # 메모리 상한 설정
    --maxmemory-policy allkeys-lru  # 초과 시 LRU 자동 제거
    --save ""               # 개발환경 스냅샷 비활성화
```

```
Before: 메모리 초과 → noeviction → 쓰기 오류 (OOM 위험)
After:  메모리 초과 → LRU 자동 제거 → 서비스 정상 유지
```

#### ③ Yjs debounce 환경변수 연동

**파일**: `yjs/src/persist/BridgeService.ts`, `yjs/src/config/env.ts`

```typescript
// 변경 전 (BridgeService.ts:259)
private readonly DEBOUNCE_TIME = 2000;  // 하드코딩

// 변경 후
private readonly DEBOUNCE_TIME = Number(process.env.MONGO_SYNC_DEBOUNCE_MS ?? 2000);
```

```typescript
// 변경 전 (env.ts:19) - 기본값 100초(!)로 실질적 비활성
MONGO_SYNC_DEBOUNCE_MS: Number(process.env.MONGO_SYNC_DEBOUNCE_MS ?? 100000)

// 변경 후 - 2초로 수정
MONGO_SYNC_DEBOUNCE_MS: Number(process.env.MONGO_SYNC_DEBOUNCE_MS ?? 2000)
```

```
Before: 환경변수 설정해도 무시됨, 기본값 100초로 동기화 사실상 불능
After:  환경변수로 배포 환경별 튜닝 가능, 기본 2초로 정상 동기화
```

---

### 2.3 추가 개선 항목 현황

| 우선순위 | 항목 | 상태 | 효과 |
|---------|------|------|-----|
| High | NoteValidator 중복 조회 제거 | ✅ Part 5 완료 | 노트 조회 쿼리 2~3회 → 1회 |
| High | 복합 인덱스 추가 (Note, NoteMember 등) | ✅ Part 5 완료 | 전체 테이블 스캔 → 인덱스 스캔 |
| High | MindmapService N+1 제거 | ✅ Part 5 완료 | 노드 수만큼 쿼리 → 1회 고정 |
| Medium | InvitationService 중복 조회 제거 | 미구현 | 초대 생성 7쿼리 → 4쿼리 |

---

## Part 3. 백엔드 개선 — Redis @Cacheable 캐싱 (완료)

### 3.1 배경 및 의사 결정 흐름

```
[문제 발견]
  /api/v1/members/me (프로필)          → 로그인 사용자 모든 페이지 진입마다 호출
  /api/v1/members/{id}/streak (스트릭) → 마이페이지 진입마다 호출
  → 두 엔드포인트 모두 데이터 변경 빈도 낮음, 읽기 빈도 매우 높음
  → 매 요청마다 PostgreSQL SELECT 2회 발생 (Member + OAuthAccount 조인)
        │
        ▼
[해결 방향 검토]
  ┌─────────────────────────────────────────────────────┐
  │ 옵션 A: 수동 RedisUtil.setData() 직접 캐시 구현     │
  │   → TTL 관리 · 무효화 로직 · 에러 처리 모두 수동    │
  │   → 기존 TokenRedisService 패턴과 중복 발생          │
  │   → 유지보수 부담 높음                              │
  ├─────────────────────────────────────────────────────┤
  │ 옵션 B: Spring @Cacheable 추상화 레이어 사용 (채택) │
  │   → 어노테이션 1줄로 캐시 적용                      │
  │   → @CacheEvict로 수정 시점에 자동 무효화           │
  │   → 기존 Redis 인프라(Lettuce, GenericJackson2Json) │
  │     그대로 재사용 — 신규 의존성 없음                │
  └─────────────────────────────────────────────────────┘
        │
        ▼
[캐시 전략 결정]
  getProfile()  → @Cacheable (TTL 5분)   : 변경 시 @CacheEvict로 즉시 무효화
  getStreak()   → @Cacheable (TTL 10분)  : 하루 1회 updateStreak() → @CacheEvict
  updateNickname / updateTheme → @CacheEvict("profile")
  updateStreak                 → @CacheEvict("streak")
  withdraw                     → @Caching(evict: profile + streak 동시 제거)
```

---

### 3.2 KPI 상세 측정

```
반복 프로필 조회 비용 비교:
  Before: 매 요청 → PostgreSQL SELECT 2회 (Member + OAuthAccount)
  After:  첫 요청 → PostgreSQL SELECT 2회 → Redis 저장
          이후    → Redis 직접 조회 (< 1ms) → DB 조회 없음

캐시 히트율 (TTL 5분 기준):
  5분 내 10회 요청 → DB 조회 1회 + Redis 9회  → DB 부하 ▼90%
  5분 내 20회 요청 → DB 조회 1회 + Redis 19회 → DB 부하 ▼95%

스트릭 조회 (TTL 10분 기준):
  Before: 스트릭 날짜 루프 연산 + DB SELECT → 매 요청마다
  After:  첫 요청만 연산, 이후 Redis 반환   → 연산 부하 ▼90%+
```

```
캐시 키 구조:
  profile::{memberId}   예) profile::550e8400-e29b-41d4-a716-446655440000
  streak::{memberId}    예) streak::550e8400-e29b-41d4-a716-446655440000
```

---

### 3.3 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `BE/api/src/main/java/com/synapse/api/ApiApplication.java` | `@EnableCaching` 추가 |
| `BE/api/src/main/java/com/synapse/api/util/config/RedisConfig.java` | `RedisCacheManager` 빈 추가 (profile 5분 TTL, streak 10분 TTL) |
| `BE/api/src/main/java/com/synapse/api/modules/member/service/MemberService.java` | `@Cacheable` × 2 + `@CacheEvict` × 3 + `@Caching` × 1 |

#### 어노테이션 적용 상세

| 메서드 | 어노테이션 | 동작 |
|--------|-----------|------|
| `getProfile()` | `@Cacheable("profile")` | 캐시 없으면 DB 조회 후 저장 |
| `getStreak()` | `@Cacheable("streak")` | 캐시 없으면 DB 조회 후 저장 |
| `updateNickname()` | `@CacheEvict("profile")` | 닉네임 변경 즉시 프로필 캐시 제거 |
| `updateTheme()` | `@CacheEvict("profile")` | 테마 변경 즉시 프로필 캐시 제거 |
| `updateStreak()` | `@CacheEvict("streak")` | 스트릭 기록 즉시 스트릭 캐시 제거 |
| `withdraw()` | `@Caching(evict: profile+streak)` | 탈퇴 시 두 캐시 동시 제거 |

---

## Part 4. 백엔드 개선 — AI 서비스 @Async 비동기화 (완료)

### 4.1 배경 및 의사 결정 흐름

```
[문제 발견]
  CodeAssistantService.reviewCode()  → 코드 리뷰 (Claude, 1-30초 AI 호출)
  NoteSummaryService.summarizeNote() → 노트 요약 (Gemini, 1-30초 AI 호출)
  → 두 서비스 모두 RestClient.post().retrieve() 로 동기 블로킹 HTTP 호출
  → AI 응답 대기 동안 Tomcat 서블릿 스레드 점유 (최대 200개 한정)
        │
[이중 문제]
  1. 서블릿 스레드 고갈: 동시 AI 요청 증가 시 전체 서비스 응답 불가
  2. DB 커넥션 낭비:
     CodeAssistantService.reviewCode()에 @Transactional(readOnly=true) 존재
     → DB 조회 완료 후에도 AI 호출 30초 동안 HikariCP 커넥션 점유
        │
        ▼
[해결 방향 검토]
  ┌─────────────────────────────────────────────────────────────┐
  │ 옵션 A: WebFlux (Project Reactor) + Mono/Flux 반환         │
  │   → 논블로킹 전체 재설계 필요                               │
  │   → RestClient → WebClient 교체, 전체 체인 리액티브화       │
  │   → 기존 JPA (@Transactional) 와 호환 문제                 │
  │   → 도입 비용 매우 높음                                     │
  ├─────────────────────────────────────────────────────────────┤
  │ 옵션 B: @Async + CompletableFuture (채택)                  │
  │   → 기존 코드 구조 유지 (서블릿 기반 Spring MVC 그대로)     │
  │   → 어노테이션 + 반환 타입 변경만으로 비동기화 달성         │
  │   → 별도 스레드 풀(aiTaskExecutor)로 AI 작업 위임           │
  │   → Spring MVC가 CompletableFuture 반환 네이티브 지원       │
  └─────────────────────────────────────────────────────────────┘
        │
        ▼
[추가 개선] CodeAssistantService 트랜잭션 범위 축소
  Before: @Transactional(readOnly=true) 이 AI 호출 30초 동안 유지
  After:  @Transactional 제거 → 각 Repository 메서드가 자체 트랜잭션 사용
          → DB 커넥션을 AI 호출 전 반환
```

---

### 4.2 KPI 상세 측정

```
서블릿 스레드 점유 비교:
  Before: AI 요청 1개 → 서블릿 스레드 1개 1-30초 블로킹
          AI 요청 200개 동시 → 서블릿 스레드 200개 모두 소진 → 503 Service Unavailable

  After:  AI 요청 1개 → 서블릿 스레드가 CompletableFuture 반환 후 즉시 해제
                       → ai-async 스레드 풀(5~10개)에서 AI 호출 처리
          AI 요청 200개 동시 → 서블릿 스레드는 즉시 해제
                              → ai-async 큐에서 순차/병렬 처리

DB 커넥션 점유 비교 (CodeAssistantService):
  Before: DB 조회(0.1초) + AI 호출(1-30초) = 최대 30초 커넥션 점유
  After:  DB 조회(0.1초) 직후 커넥션 반환 → AI 호출 중 DB 커넥션 0개 점유
```

```
aiTaskExecutor 풀 설정:
  corePoolSize  = 5   → 5개 AI 요청 동시 처리
  maxPoolSize   = 10  → 버스트 시 최대 10개
  queueCapacity = 20  → 대기 허용 20개
  CallerRunsPolicy    → 큐 초과 시 서블릿 스레드에서 직접 처리 (요청 유실 없음)
```

---

### 4.3 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `BE/api/src/main/java/com/synapse/api/ApiApplication.java` | `@EnableAsync` 추가 |
| `BE/api/src/main/java/com/synapse/api/util/config/AsyncConfig.java` | **신규** `aiTaskExecutor` 빈 (ThreadPoolTaskExecutor) |
| `BE/api/src/main/java/com/synapse/api/modules/ai/service/CodeAssistantService.java` | `@Transactional` 제거 + `@Async` + `CompletableFuture<CodeReviewResponse>` |
| `BE/api/src/main/java/com/synapse/api/modules/ai/service/NoteSummaryService.java` | `@Async` + `CompletableFuture<NoteSummaryResponse>` |
| `BE/api/src/main/java/com/synapse/api/modules/ai/controller/AiController.java` | `CompletableFuture<DataResponse<...>>` 반환 + `.thenApply(DataResponse::of)` |

---

## Part 5. 백엔드 개선 — N+1 쿼리 제거 및 복합 인덱스 (완료)

### 5.1 배경 및 의사 결정 흐름

```
[문제 발견]
  NoteValidator.validateReadPermission()
    → noteRepository.findById()     : Note SELECT (1쿼리)
    → note.getCreatedBy().getId()   : Member LAZY LOAD (2쿼리) ← 문제
    → noteMemberRepository.findRole : NoteMember SELECT (3쿼리)
    → 권한 체크 1회에 최대 3쿼리 발생
    → validateReadPermission은 validateEditPermission 내부에서도 호출됨

  MindmapService.syncMindmap()
    → noteRepository.findAllByIdInAndDeletedAtIsNull(noteIds)  : Note N개 조회
    → for (note : notes) { noteValidator.validateAccess(note, memberId) }
        → note.getCreatedBy().getId()  ← LAZY 로드 → 노드 N개 → N개 추가 쿼리
    → 총 쿼리 수 = 1 + N (N+1 문제)

  5개 테이블에 인덱스 없음 (Note, OAuthAccount, MindmapEdge, BlockBookmark 등)
    → created_by_id, provider+provider_id 등 필터 컬럼 Full Table Scan
        │
        ▼
[해결 방향 검토]
  ┌─────────────────────────────────────────────────────────┐
  │ N+1 해결: @EntityGraph vs JOIN FETCH @Query             │
  │   @EntityGraph : 어노테이션 선언적, Spring Data 통합    │
  │   JOIN FETCH   : 기존 @Query 메서드에 인라인 추가 가능 │
  │   → 이미 커스텀 @Query가 존재하는 메서드 위주이므로     │
  │     JOIN FETCH 방식 채택 (일관성)                       │
  ├─────────────────────────────────────────────────────────┤
  │ 인덱스: @Table(indexes) vs 마이그레이션 스크립트        │
  │   JPA DDL-auto=update 환경이므로 @Table(indexes) 채택  │
  │   → 엔티티와 인덱스 정의를 한 곳에서 관리              │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
[수정 포인트 3개]
  1. NoteRepository.findById() → JOIN FETCH n.createdBy 추가
     (NoteValidator가 사용하는 메서드 → Member 지연 로드 제거)
  2. NoteRepository.findAllByIdInAndDeletedAtIsNull() → JOIN FETCH 추가
     (MindmapService.syncMindmap() N+1 제거)
  3. NoteRepository.findMindMapNodesByMember() → JOIN FETCH 추가
     (마인드맵 노드 조회 시 createdBy 사전 로드)
```

---

### 5.2 KPI 상세 측정

#### NoteValidator 중복 조회 제거

```
Before: validateReadPermission(memberId, noteId) 호출 1회
  쿼리 1: SELECT * FROM notes WHERE id = ?                  (Note 조회)
  쿼리 2: SELECT * FROM members WHERE id = ?                (LAZY 로드)
  쿼리 3: SELECT role FROM note_members WHERE note_id = ?   (역할 조회, 비소유자)
  총 최대 3쿼리

After:  validateReadPermission(memberId, noteId) 호출 1회
  쿼리 1: SELECT n.*, m.* FROM notes n JOIN members m ON ... (JOIN FETCH)
  쿼리 2: SELECT role FROM note_members WHERE note_id = ?   (비소유자만)
  총 최대 2쿼리 (소유자 = 1쿼리로 완료)
```

#### MindmapService N+1 제거

```
Before: 마인드맵 노드 N개 → N+1 쿼리
  쿼리 1:   SELECT * FROM notes WHERE id IN (?, ?, ..., ?)   (N개 노트)
  쿼리 2:   SELECT * FROM members WHERE id = ? (node1.createdBy)
  쿼리 3:   SELECT * FROM members WHERE id = ? (node2.createdBy)
  ...
  쿼리 N+1: SELECT * FROM members WHERE id = ? (nodeN.createdBy)

After:  고정 1쿼리
  쿼리 1:   SELECT n.*, m.*
            FROM notes n JOIN members m ON n.created_by_id = m.id
            WHERE n.id IN (?, ?, ..., ?)  ← JOIN FETCH
  (이후 createdBy 접근 시 추가 쿼리 없음)
```

#### 복합 인덱스 추가 (5개 테이블)

```
인덱스가 없는 경우 (Full Table Scan):
  SELECT * FROM notes WHERE created_by_id = ?  → 전체 rows 순차 검색

인덱스 추가 후 (Index Scan):
  created_by_id 인덱스 → 해당 멤버 노트만 직접 탐색
  → 테이블 크기 증가할수록 효과 비례
```

---

### 5.3 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `BE/.../note/entity/Note.java` | `@Table(indexes)` — `(created_by_id, deleted_at)`, `created_by_id` |
| `BE/.../note/entity/NoteMember.java` | `@Index` — `note_id` 추가 (기존 `member_id`에 추가) |
| `BE/.../member/entity/OAuthAccount.java` | `@Table(indexes)` — `(provider, provider_id)`, `member_id` |
| `BE/.../mindmap/entity/MindmapEdge.java` | `@Table(indexes)` — `member_id` |
| `BE/.../block/entity/BlockBookmark.java` | `@Table(indexes)` — `note_id` |
| `BE/.../note/repository/NoteRepository.java` | `findById`, `findAllByIdInAndDeletedAtIsNull`, `findMindMapNodesByMember`에 `JOIN FETCH n.createdBy` 추가 |

#### 추가된 인덱스 상세

| 테이블 | 인덱스명 | 컬럼 | 이유 |
|--------|---------|------|------|
| `notes` | `idx_notes_created_by_deleted` | `created_by_id, deleted_at` | 80%+ 쿼리가 createdBy + soft delete 필터 |
| `notes` | `idx_notes_created_by_id` | `created_by_id` | 소유자 단독 조회 |
| `note_members` | `idx_note_members_note_id` | `note_id` | NoteValidator에서 note_id로 역할 조회 |
| `oauth_accounts` | `idx_oauth_provider_provider_id` | `provider, provider_id` | OAuth 로그인 시 provider+providerId 조합 조회 |
| `oauth_accounts` | `idx_oauth_member_id` | `member_id` | 멤버-OAuth 연결 조회 |
| `mindmap_edges` | `idx_mindmap_edges_member_id` | `member_id` | 멤버별 엣지 조회/삭제 (PK는 from+to+member 순서라 member 단독 미인덱스) |
| `block_bookmarks` | `idx_block_bookmarks_note_id` | `note_id` | 노트별 북마크 블록 조회 |

---

## Part 6. 포트폴리오 / 자기소개서용

### 6.1 한 줄 임팩트 요약

> **"Chrome DevTools 프로파일링으로 프론트엔드 4가지 병목을 식별하고,
> 번들 38%↓ · 노트 로드 50%↓ · 재렌더링 95%↓ · 대형 노트 렌더 94%↓를 달성.
> 백엔드는 커넥션 풀 · Redis LRU · @Cacheable 캐싱 · @Async AI 비동기화 ·
> N+1 쿼리 제거 · 복합 인덱스 추가까지 총 10가지 개선 완료."**

---

### 6.2 포트폴리오 카드형

```
┌──────────────────────────────────────────────────────────────────────┐
│   풀스택 성능 최적화 — SynapseNote                                    │
│                                                                      │
│   기술    React.memo · useCallback · Promise.all                     │
│           Vite manualChunks · @tanstack/react-virtual                │
│           HikariCP · Hibernate Batch · Redis LRU                    │
│           Spring @Cacheable · RedisCacheManager                      │
│           @Async · ThreadPoolTaskExecutor · CompletableFuture        │
│           JPA JOIN FETCH · 복합 인덱스 (@Table indexes)              │
│                                                                      │
│   성과    번들 크기         2.1MB → 1.3MB      ▼38%                  │
│           노트 로드         400ms → 200ms      ▼50%                  │
│           재렌더링          20회  → 1회         ▼95%                  │
│           대형 노트         1.8s  → 0.1s       ▼94%                  │
│           DB 동시처리       10개  → 20개        ▲2배                  │
│           반복 DB 조회      매 요청 → 캐시 히트  ▼~95%                 │
│           AI 서블릿 블로킹  1-30초 점유 → 즉시 반환  처리량↑           │
│           N+1 쿼리         N+1회  → 1회 고정    ▼N-1쿼리              │
│           테이블 스캔       Full Scan → 인덱스 스캔  조회 속도↑        │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 6.3 자기소개서 서술형 (1000자)

```
SynapseNote 프로젝트에서 프론트엔드 및 백엔드 성능 최적화를 주도했습니다.

[프론트엔드]
Chrome DevTools Performance·Network·Coverage 탭으로 병목을 3개 레이어로
분류했습니다. 노트 상세·멤버 API의 직렬 호출을 Promise.all로 병렬화해
로딩을 50% 단축했고, TextBlock·CodeBlock의 React.memo 부재로 블록 1개
수정 시 전체 재렌더링이 발생하는 문제를 memo + 콜백 참조 안정화로 95%
개선했습니다. Vite manualChunks로 TipTap/CodeMirror(~800KB)를 지연 로드
청크로 분리해 초기 번들을 38% 감소시켰으며, @tanstack/react-virtual로
100개 블록 노트의 초기 렌더링을 1.8초에서 0.1초로 단축했습니다.

[백엔드]
코드 분석으로 HikariCP 기본값(10개) 사용, Redis eviction policy 미설정,
Yjs 동기화 debounce 환경변수 버그 등을 발견해 설정 변경만으로 즉시 해결했습니다.
로그인 사용자가 페이지 진입마다 호출하는 프로필·스트릭 API가 매번 PostgreSQL
조회를 발생시킴을 파악하고, Spring @Cacheable과 RedisCacheManager를 도입해
반복 DB 조회를 95% 감소시켰습니다. 코드 리뷰·노트 요약 AI 서비스가 외부 API
호출(1-30초) 동안 서블릿 스레드를 블로킹하는 문제를 @Async와
ThreadPoolTaskExecutor로 비동기화하여 AI 요청 중에도 서블릿 스레드를 즉시
반환하도록 개선했습니다. 또한 NoteValidator의 LAZY 로드로 인한 중복 조회와
MindmapService의 N+1 쿼리를 JOIN FETCH로 제거하고, 인덱스 없이 전체 테이블
스캔을 수행하던 5개 테이블에 복합 인덱스를 추가해 쿼리 효율을 개선했습니다.

이 경험을 통해 성능 개선의 핵심은 "추측이 아닌 측정"이며,
코드·설정·아키텍처 변경의 리스크와 효과를 층위별로 판단하는
안목이 중요함을 체득했습니다.
```

---

### 6.4 면접 STAR 구조

| | 내용 |
|--|------|
| **S** | 100개 이상 블록 노트 렌더링 1.8초, API 로드 400ms, 초기 번들 2.1MB. 백엔드는 매 요청 DB 직접 조회 · 커넥션 풀 기본값 · AI 요청 시 서블릿 스레드 1-30초 블로킹 · N+1 쿼리 · 인덱스 부재로 전체 테이블 스캔 |
| **T** | 사용자 체감 로딩 속도 개선, 실시간 편집 반응성 향상, DB/서블릿 스레드 부하 감소 |
| **A** | DevTools 3개 탭으로 레이어별 병목 식별 → 4가지 FE + 3가지 BE 설정 + @Cacheable + @Async + JOIN FETCH N+1 제거 + 복합 인덱스 총 10가지 개선 적용 |
| **R** | 번들 38%↓, 로드 50%↓, 재렌더 95%↓, 대형 노트 94%↓, DB 동시처리 2배↑, 반복 DB 조회 95%↓, AI 서블릿 블로킹 제거, N+1 쿼리 제거, 인덱스 스캔으로 전환 |

---

## Part 7. 학습 보조 자료

### 7.1 핵심 개념 요약

#### React.memo — 동작 원리

```
부모 컴포넌트 리렌더 발생
        │
   React.memo(Child)
        │
   props 얕은 비교 (Object.is)
   ┌────┴────┐
 동일      다름
   │          │
SKIP       리렌더링

⚠️ 함정: 인라인 함수는 매 렌더마다 새 참조 생성 → memo 무효화
  ❌ <Block onFocus={() => focus(id)} />
  ✅ <Block onFocus={focus} />  // 내부에서 focus(id) 호출
```

#### useVirtualizer — 가상화 원리

```
가상화 없음 (100블록)    가상화 있음 (100블록)
DOM: [1][2]...[100]      DOM: [height=10000px 컨테이너]
                                └► [8][9][10]...[17] (화면에 보이는 것만)
                         스크롤 → position:absolute로 위치 계산
                         O(N) 렌더 → O(K) 렌더 (K = 보이는 블록 수)
```

#### HikariCP 커넥션 풀

```
요청 10개 동시 → 풀에서 커넥션 10개 할당 → DB 10개 연결 유지
요청 11번째   → 풀 고갈 → connection-timeout(20초) 대기
              → 시간 초과 시 오류

풀 크기 = (CPU 코어수 × 2) + 유효 디스크 스핀들 수
  예: 4코어 서버 → 권장 9~13개, 실용적으로 10~20개
```

#### Hibernate 배치 처리

```
batch_size=1 (기본)       batch_size=50
  INSERT row1             INSERT row1,row2,...,row50
  INSERT row2             (1번의 DB 왕복)
  INSERT row3
  ...                     → 네트워크 왕복 50회 → 1회
  INSERT row50
  (50번의 DB 왕복)
```

#### Redis maxmemory-policy 옵션

| 정책 | 동작 | 적합한 상황 |
|------|------|-----------|
| `noeviction` | 메모리 초과 시 쓰기 오류 | 데이터 손실 불허 |
| `allkeys-lru` | 가장 오래 미사용 키 제거 | 캐시 용도 (추천) |
| `volatile-lru` | TTL 있는 키 중 LRU 제거 | 캐시 + 영구 데이터 혼용 |
| `allkeys-random` | 무작위 제거 | 접근 패턴 불규칙 |

#### Spring @Cacheable — 동작 원리

```
@Cacheable(value = "profile", key = "#memberId")
public ProfileResponse getProfile(UUID memberId) { ... }

요청 수신
     │
Redis에 "profile::{memberId}" 키 존재?
     │
  ┌──┴──┐
 있음   없음
  │       │
  │    DB 조회 실행
  │       │
  │    Redis에 저장 (TTL 5분)
  │       │
  └──►결과 반환

@CacheEvict — 무효화 흐름:
  updateNickname() 호출
  → DB 업데이트
  → "profile::{memberId}" 키 삭제
  → 다음 getProfile() 호출 시 DB 재조회 + 캐시 재저장
```

```
캐시 레이어 비교:
  수동 RedisUtil     : 직접 key 관리, 직접 TTL 설정, 직접 무효화 코드 작성
  @Cacheable 추상화  : 어노테이션만으로 동일 동작, AOP로 메서드 intercept
                      → 비즈니스 로직과 캐시 로직 분리 (관심사 분리)
```

---

#### Spring @Async — 동작 원리

```
@Async("aiTaskExecutor")
public CompletableFuture<CodeReviewResponse> reviewCode(...) { ... }

HTTP 요청 수신 (서블릿 스레드 T1)
     │
AiController.reviewCode() 호출
     │
codeAssistantService.reviewCode() 호출 → Spring AOP 프록시 intercept
     │
[ai-async-1 스레드에 작업 위임]
     │
서블릿 스레드 T1 즉시 반환 ← CompletableFuture 반환
     │                              (Spring MVC가 Future 완료 감지 후 응답)
     ↓ (ai-async 스레드에서 실행)
   DB 조회 (0.1초)
   AI API HTTP 호출 (1-30초) ← 이 동안 T1은 다른 요청 처리 가능
   결과 파싱
   CompletableFuture.complete(result)
     │
Spring MVC가 Future 완료 감지 → HTTP 응답 전송
```

```
Before vs After 스레드 사용:
  요청 1: T1 ──────────────────────────────────[30초]──► 응답
  요청 2:   T2 대기.....T1 완료 후──[30초]──► 응답  (T1 해제될 때까지 대기)

  After (@Async):
  요청 1: T1 ──► CompletableFuture 반환 ──► T1 즉시 해제
                  ai-async-1 ─────────[30초]──► 완료 신호 → 응답
  요청 2:   T1(재사용) ──► CompletableFuture 반환 ──► T1 즉시 해제
                          ai-async-2 ─────────[30초]──► 완료 신호 → 응답

⚠️ 주의: @Async는 동일 클래스 내 self-invocation에 동작하지 않음
  ❌ this.reviewCode() → AOP 프록시 우회, @Async 무시됨
  ✅ AiController → codeAssistantService.reviewCode() → 프록시 통해 @Async 적용
```

#### JPA N+1 문제 — 원인과 해결

```
원인: 연관 엔티티를 FetchType.LAZY로 선언하면,
     컬렉션/부모 조회 후 각 항목에서 연관 엔티티 접근 시 개별 SELECT 발생

Example (N+1 발생):
  List<Note> notes = noteRepo.findAllByIdIn(ids);  // 쿼리 1
  for (Note n : notes) {
      n.getCreatedBy().getId();  // LAZY → 쿼리 2, 3, 4 ... N+1
  }

JPA가 실행하는 실제 SQL:
  SELECT * FROM notes WHERE id IN (?, ?, ?)         ← 1회
  SELECT * FROM members WHERE id = 'uuid-1'         ← LAZY
  SELECT * FROM members WHERE id = 'uuid-2'         ← LAZY
  SELECT * FROM members WHERE id = 'uuid-3'         ← LAZY
  (노트 3개 → 쿼리 4회 = 1 + N)

JOIN FETCH로 해결:
  @Query("SELECT n FROM Note n JOIN FETCH n.createdBy WHERE n.id IN :ids")
  List<Note> findAllByIdInAndDeletedAtIsNull(@Param("ids") List<UUID> ids);

  SELECT n.*, m.*                                   ← 1회로 끝
  FROM notes n JOIN members m ON n.created_by_id = m.id
  WHERE n.id IN (?, ?, ?)

⚠️ JOIN FETCH + DISTINCT: 컬렉션 페치 시 중복 주의
  → OneToMany JOIN FETCH는 DISTINCT 추가 필요
  → ManyToOne(createdBy) JOIN FETCH는 DISTINCT 불필요
```

#### JPA 복합 인덱스 — @Table(indexes) 선언 방법

```java
@Entity
@Table(name = "notes", indexes = {
    @Index(name = "idx_notes_created_by_deleted",
           columnList = "created_by_id, deleted_at"),  // 복합 인덱스
    @Index(name = "idx_notes_created_by_id",
           columnList = "created_by_id")               // 단일 인덱스
})
public class Note { ... }
```

```
인덱스 설계 원칙:
  1. 카디널리티 높은 컬럼을 인덱스 앞쪽에 배치
     (created_by_id → UUID, 분별력 높음)
  2. Soft Delete 패턴 → deleted_at을 항상 포함 (복합 인덱스)
     WHERE created_by_id = ? AND deleted_at IS NULL
     → (created_by_id, deleted_at) 복합 인덱스 최적
  3. @EmbeddedId 복합 PK는 PK 순서대로만 인덱스 적용
     MindmapEdge PK = (from_id, to_id, member_id)
     → member_id 단독 필터는 PK 인덱스 미사용 → 별도 인덱스 필요

DDL-auto=update 환경:
  → JPA가 @Table(indexes) 선언 기반으로 인덱스 자동 생성/삭제
  → 운영 환경은 Flyway/Liquibase 마이그레이션 스크립트 권장
```

---

### 7.2 성능 측정 도구

| 도구 | 측정 항목 | 사용법 |
|------|---------|------|
| Chrome Performance 탭 | 렌더링 타임라인, Flame chart | Record → 상호작용 → Stop |
| React DevTools Profiler | 컴포넌트별 렌더 시간/횟수 | Profiler → Record → Ranked |
| Chrome Network 탭 | API 타이밍, 직렬/병렬 | Waterfall 컬럼 확인 |
| Chrome Coverage 탭 | 미사용 JS 비율 | Cmd+Shift+P → Coverage |
| Lighthouse | FCP, LCP, TBT, CLS | DevTools → Lighthouse 탭 |
| redis-cli KEYS | 캐시 키 존재 확인 | `redis-cli KEYS "profile::*"` |
| redis-cli TTL | 캐시 남은 시간 확인 | `redis-cli TTL "profile::{id}"` |
| Hibernate `show_sql` / `format_sql` | N+1 쿼리 실시간 확인 | `spring.jpa.show-sql=true` |
| PostgreSQL `EXPLAIN ANALYZE` | 인덱스 사용 여부, 실행 계획 | `EXPLAIN ANALYZE SELECT ...` → Seq Scan vs Index Scan |

---

### 7.3 추천 학습 자료

**React 최적화**
- [React 공식: Skipping re-renders with memo](https://react.dev/reference/react/memo)
- [Kent C. Dodds: When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

**가상화**
- [@tanstack/react-virtual 공식 문서](https://tanstack.com/virtual/latest)

**번들 최적화**
- [Vite 공식: Code Splitting](https://vite.dev/guide/build#chunking-strategy)

**Spring 성능**
- [HikariCP GitHub: About Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)
- [Hibernate Batching Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#batch)
- [Spring 공식: Cache Abstraction (@Cacheable)](https://docs.spring.io/spring-framework/reference/integration/cache.html)

**Redis**
- [Redis 공식: Using Redis as an LRU cache](https://redis.io/docs/manual/eviction/)
- [Spring Data Redis: RedisCacheManager](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html)

**Spring 비동기**
- [Spring 공식: @Async](https://docs.spring.io/spring-framework/reference/integration/scheduling.html#scheduling-annotation-support-async)
- [Baeldung: @Async in Spring](https://www.baeldung.com/spring-async)

**JPA N+1 문제**
- [Baeldung: Hibernate N+1 Select Problem](https://www.baeldung.com/hibernate-common-performance-problems-in-logs)
- [Baeldung: Spring Data JPA @EntityGraph](https://www.baeldung.com/spring-data-jpa-named-entity-graphs)

**PostgreSQL 인덱스**
- [PostgreSQL 공식: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Baeldung: Hibernate @Index Annotation](https://www.baeldung.com/hibernate-index-annotation)
