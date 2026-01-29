
# 📘 src/api 설계 규약 & 사용 가이드

이 문서는 **프론트엔드에서 사용하는 모든 API 요청을
일관된 방식으로 정의하고 사용하는 것을 목표로 한다.**

`src/api`는 단순한 유틸 폴더가 아니라
**백엔드 API 명세를 코드로 고정해두는 계약 계층**이다.

---

## 🎯 목적

* API 명세를 **코드 레벨에서 선 정의**
* 각 화면(UI)은 **필요한 데이터만 가공해서 사용**
* API 변경 시 **수정 범위를 최소화**
* axios / 인증 / 공통 요청 로직을 **중앙 집중화**
* Electron + Web 환경에서 **안정적인 API 사용 보장**

---

## 🧱 전체 디렉토리 구조

```txt
src/api/
 ├─ axios.ts           # axios 인스턴스 + 인증 interceptor
 ├─ request.ts         # 공통 API 요청 래퍼
 ├─ notes/
 │   ├─ notes.api.ts
 │   ├─ notes.adapter.ts
 │   ├─ bookmarks.api.ts
 │   ├─ bookmarks.adapter.ts
 │   ├─ createNote.api.ts
 │   └─ deleteNote.api.ts
```

---

## 🔐 axios.ts 규칙

### 역할

* 프로젝트 전역에서 사용하는 **단일 axios 인스턴스**
* 인증 토큰 자동 첨부

### 규칙

* ❌ `axios` 직접 import 금지
* ✅ 모든 API 요청은 반드시 이 인스턴스 사용

```ts
// src/api/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🔁 request.ts (공통 API 요청 래퍼)

### 목적

* HTTP 요청 방식을 통일
* axios 의존성을 API 레이어 내부로 숨김

```ts
// src/api/request.ts
import { api } from './axios';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const request = async <T>(
  method: HttpMethod,
  url: string,
  options?: {
    params?: Record<string, any>;
    body?: any;
  }
): Promise<T> => {
  const res = await api.request<T>({
    method,
    url,
    params: options?.params,
    data: options?.body,
  });
  return res.data;
};
```

---

## 📄 API 파일 규칙 (`*.api.ts`)

### 역할

* **백엔드 API 명세서를 그대로 코드로 옮긴 파일**
* URL / method / params / body / response 타입 정의

### 규칙

* ❌ response 데이터 가공 금지
* ❌ UI 로직 포함 금지
* ❌ `map / filter / reduce` 사용 금지
* ✅ 백엔드 명세와 1:1 매칭 유지

### 예시

```ts
// src/api/notes/notes.api.ts
import { request } from '../request';
import type { GetNotesResponse } from '../../types/note/getNotes';

export const getNotesApi = (params?: {
  page?: number;
  size?: number;
}) => {
  return request<GetNotesResponse>('get', '/v1/notes', {
    params,
  });
};
```

---

## 🔄 Adapter 파일 규칙 (`*.adapter.ts`)

### 역할

* API 응답을 **화면(UI)에서 사용하기 좋은 형태로 변환**

### 규칙

* ❌ API 호출 금지
* ❌ axios / request 의존 금지
* ❌ 비즈니스 로직 포함 금지
* ✅ 화면 단위로 adapter 분리 가능

### 예시

```ts
// src/api/notes/notes.adapter.ts
import type { GetNotesResponse, NoteListItem } from '../../types/note/getNotes';

export const adaptNotesForSidebar = (
  res: GetNotesResponse
): NoteListItem[] => {
  return res.data.notes;
};
```

---

## 🧩 컴포넌트 사용 규칙

컴포넌트는 **API 응답 구조를 직접 알지 않는다.**
반드시 adapter 결과만 사용한다.

```ts
const res = await getNotesApi();
const notes = adaptNotesForSidebar(res);
```

### 컴포넌트 금지 사항

* ❌ `res.data.xxx` 접근
* ❌ URL 직접 사용
* ❌ axios / request 직접 import

---

## 🧪 타입 정의 규칙 (`src/types`)

* 타입은 **백엔드 응답 구조 기준으로 정의**
* adapter에 맞추어 타입을 축소하거나 변형하지 않는다

```ts
export interface GetNotesResponse {
  success: boolean;
  data: {
    notes: Note[];
    pagination: Pagination;
  };
}
```

---

## 📌 설계 원칙 요약

| 구분        | 허용         | 금지        |
| --------- | ---------- | --------- |
| api       | 명세 그대로 반환  | 데이터 가공    |
| adapter   | 데이터 가공     | API 호출    |
| component | adapter 사용 | API 구조 의존 |
| axios     | 단일 인스턴스    | 직접 호출     |

---

## ⚠️ 주의 사항

* 과도한 추상화 금지
* 범용 adapter 남발 금지
* `api.call({ ... })` 같은 메타 API 구조 지양

---

## ✨ Adapter를 추가하는 기준

* 같은 API를 **여러 화면에서 다르게 사용할 때**
* pagination / metadata 필요 여부가 달라질 때
* Sidebar / Modal / Search 등 **UI 책임이 다를 때**

---

