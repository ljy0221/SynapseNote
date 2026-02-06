import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loading } from './components/common/loading/Loading';

// Layout
import RootLayout from './RootLayout';

// Lazy loaded pages
const Login = lazy(() => import('./pages/login/Login'));
const OAuthCallback = lazy(() => import('./pages/login/OAuthCallback'));
const Home = lazy(() => import('./pages/home/Home'));
const Note = lazy(() => import('./pages/note/Note'));
const MindMap = lazy(() => import('./pages/mindmap/MindMap'));
const AcceptInvitation = lazy(() => import('./pages/invitation/AcceptInvitation'));
const InviteLanding = lazy(() => import('./pages/invite/InviteLanding'));

const withSuspense = (Component: React.ComponentType) => (
    <Suspense fallback={<Loading />}>
        <Component />
    </Suspense>
);

const routes = [
    {
        path: '/',
        element: <RootLayout />, // 공통 레이아웃 적용
        children: [
            { index: true, element: <Navigate to="/login" replace /> },
            { path: 'login', element: withSuspense(Login) },
            { path: 'auth/:provider/callback', element: withSuspense(OAuthCallback) },
            { path: 'home', element: withSuspense(Home) },
            { path: 'note', element: withSuspense(Note) },
            { path: 'note/:noteId', element: withSuspense(Note) },
            { path: 'notes/invitation/:token', element: withSuspense(AcceptInvitation) },
            { path: 'invite/:code', element: withSuspense(InviteLanding) }, // [New] 초대 랜딩 페이지
            { path: 'mindmap', element: withSuspense(MindMap) },
        ],
    },
];

// Electron 환경 감지 (window.electronAPI 등 사용 또는 userAgent 확인)
const isElectron = typeof window !== 'undefined' && (
    (window as any).electronAPI !== undefined ||
    navigator.userAgent.toLowerCase().includes(' electron/')
);

const router = isElectron ? createHashRouter(routes) : createBrowserRouter(routes);

export default router;