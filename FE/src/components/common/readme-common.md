## common (Shared UI)
**프로젝트 전반에서 재사용되는 "순수 UI 컴포넌트"들의 집합입니다.**

* **역할:** 비즈니스 로직(API 호출, 특정 상태 의존) 없이 `props`로 받은 데이터만 렌더링합니다.
* **특징:** 도메인(기능)과 무관하게 어디서든 가져다 쓸 수 있어야 합니다. (Atomic Design의 Atoms/Molecules 수준)
* **Electron 관련:** OS 네이티브 스타일이 적용된 기본 UI 요소들도 여기에 포함됩니다.

| 예시 (Example)                | 설명 |
|:----------------------------| :--- |
| `Button.tsx`                | 기본 버튼 |
| `Input.tsx`, `Checkbox.tsx` | 폼 입력 요소 |
| `Modal.tsx`                 | 범용 모달 창 |
| `Icon.tsx`                  | SVG 아이콘 래퍼 |
| `Badge.tsx`                 | 알림 뱃지 등 |

> **❌ 주의:** 이곳의 컴포넌트 내부에서는 `useSelector`(Redux)나 `fetch`(API)를 직접 호출하지 마세요.

