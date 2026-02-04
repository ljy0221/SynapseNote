import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from './RootLayout'; // 레이아웃 분리
import Login from './pages/login/Login';
import OAuthCallback from './pages/login/OAuthCallback';
import Home from './pages/home/Home';
import Note from './pages/note/Note';
import MindMap from './pages/mindmap/MindMap';
import AcceptInvitation from './pages/invitation/AcceptInvitation';

const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />, // 공통 레이아웃 적용
        children: [
            { index: true, element: <Navigate to="/login" replace /> },
            { path: 'login', element: <Login /> },
            { path: 'auth/:provider/callback', element: <OAuthCallback /> },
            { path: 'home', element: <Home /> },
            { path: 'note', element: <Note /> },
            { path: 'note/:noteId', element: <Note /> },
            { path: 'notes/invitation/:token', element: <AcceptInvitation /> },
            { path: 'mindmap', element: <MindMap /> },
        ],
    },
]);

export default router;