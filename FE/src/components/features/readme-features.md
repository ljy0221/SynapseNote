## features (Business Logic & Domain)
**특정 "기능(도메인)"에 종속된 컴포넌트 그룹입니다.**

* **역할:** 실제 비즈니스 로직을 수행하거나, 특정 기능에만 사용되는 복합적인 UI입니다.
* **특징:** 폴더명을 기능 이름으로 만들고, 그 안에 관련 컴포넌트를 모아둡니다.
* **의존성:** 상태 관리 스토어(Redux/Zustand)나 API 훅을 내부에서 직접 사용할 수 있습니다.

### 구조 예시
```text
features/
├── auth/               # 인증 관련
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── file-manager/       # 파일 관리 기능
│   ├── FileList.tsx
│   ├── FileItem.tsx
│   └── FilePreview.tsx
└── dashboard/          # 대시보드 관련
    ├── StatsChart.tsx
    └── RecentActivity.tsx
```

### === 현위치부터 프로젝트에 관한 파일을 명세합니다===