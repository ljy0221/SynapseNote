// src/components/layout/sidebar/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import './Sidebar.css';

import type { NoteListItem } from '../../../types/note/GetNotes';
import { buildNoteTree } from '../../features/noteDirectory/buildNoteTree';
import { NoteDirectory } from './NoteDirectory';

import ContextMenu from '../../common/contextMenu/ContextMenu';
import type { ContextMenuState } from '../../../types/sidebar/ContextMenu';

import { getNotesApi } from '../../../api/notes/Notes.api';
import { adaptNotesForSidebar } from '../../../api/notes/Notes.adapter';

import {
    getBookmarksApi,
    addBookmarkApi,
    removeBookmarkApi,
} from '../../../api/bookmark/Bookmarks.api';
import { adaptBookmarkIds } from '../../../api/bookmark/Bookmarks.adapter';

import { createNoteApi } from '../../../api/notes/CreateNote.api';
import { deleteNoteApi } from '../../../api/notes/DeleteNote.api';

import {
    NOTES_CHANGED_EVENT,
    emitNotesChanged,
} from '../../../events/NotesEvents';

import { useNavigate, useParams } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    isOpen,
                                                    onToggle,
                                                }) => {
    const navigate = useNavigate();
    const { noteId: routeNoteId } = useParams<{ noteId: string }>();

    /** active 상태의 단일 기준은 URL의 noteId */
    const activeNoteId = routeNoteId ?? null;

    const [notes, setNotes] = useState<NoteListItem[]>([]);
    const [favoriteNoteIds, setFavoriteNoteIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false });

    const noteTree = buildNoteTree(notes);

    /** Sidebar 데이터 페칭 (Notes + Bookmarks) */
    const fetchSidebarData = async () => {
        setIsLoading(true);
        try {
            const [notesRes, bookmarksRes] = await Promise.all([
                getNotesApi(),
                getBookmarksApi(),
            ]);

            const adaptedBookmarkIds = adaptBookmarkIds(bookmarksRes);
            setNotes(adaptNotesForSidebar(notesRes));
            setFavoriteNoteIds(adaptedBookmarkIds);
        } catch (error) {
            console.error('[Sidebar] 데이터 로딩 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /** 최초 로딩 및 노트 변경 이벤트 구독 */
    useEffect(() => {
        fetchSidebarData();

        window.addEventListener(NOTES_CHANGED_EVENT, fetchSidebarData);
        return () => {
            window.removeEventListener(NOTES_CHANGED_EVENT, fetchSidebarData);
        };
    }, []);

    /** 노트 선택 핸들러 (URL 기반 이동) */
    const handleSelectNote = (noteId: string) => {
        if (!noteId || noteId.startsWith('temp-')) return;
        navigate(`/notes/${noteId}`);
    };

    /** 즐겨찾기 토글 (낙관적 업데이트 적용) */
    const handleToggleFavorite = async (noteId: string) => {
        if (!noteId || noteId.startsWith('temp-')) return;

        const isFavorite = favoriteNoteIds.has(noteId);

        // Optimistic UI: 먼저 UI 반영
        setFavoriteNoteIds(prev => {
            const next = new Set(prev);
            isFavorite ? next.delete(noteId) : next.add(noteId);
            return next;
        });

        try {
            if (isFavorite) {
                await removeBookmarkApi(noteId);
            } else {
                await addBookmarkApi(noteId);
            }
        } catch (e) {
            console.error('[Sidebar] 즐겨찾기 토글 실패', e);
            // 실패 시 롤백
            setFavoriteNoteIds(prev => {
                const next = new Set(prev);
                isFavorite ? next.add(noteId) : next.delete(noteId);
                return next;
            });
        }
    };

    /** 노트 생성 핸들러 */
    const handleCreateNote = async (directoryPath: string) => {
        const tempNote: NoteListItem = {
            userId: 'temp-user',
            noteId: `temp-${Date.now()}`,
            title: '새 노트',
            directoryPath,
            pointX: 0,
            pointY: 0,
            role: 'OWNER',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setNotes(prev => [...prev, tempNote]);

        try {
            await createNoteApi({
                title: '새 노트',
                invitationUrl: '',
                directoryPath,
            });
            emitNotesChanged();
        } catch (e) {
            setNotes(prev => prev.filter(n => n.noteId !== tempNote.noteId));
            console.error('[Sidebar] 노트 생성 실패', e);
        }
    };

    /** 노트 삭제 핸들러 */
    const handleDeleteNote = async (noteId: string) => {
        setNotes(prev => prev.filter(n => n.noteId !== noteId));

        try {
            await deleteNoteApi(noteId);
            emitNotesChanged();
        } catch (e) {
            console.error('[Sidebar] 노트 삭제 실패', e);
            emitNotesChanged(); // 데이터 일관성을 위해 다시 페칭 유도
        }
    };

    return (
        <div className="sidebar-wrapper">
            <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-inner">
                    {isLoading ? (
                        <div className="sidebar-loading">Loading...</div>
                    ) : (
                        <NoteDirectory
                            node={noteTree}
                            activeNoteId={activeNoteId}
                            favoriteNoteIds={favoriteNoteIds}
                            onSelectNote={handleSelectNote}
                            onToggleFavorite={handleToggleFavorite}
                            onContextMenu={setContextMenu}
                        />
                    )}
                </div>
            </aside>

            <button
                className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={onToggle}
                aria-label="Toggle Sidebar"
            >
                {isOpen ? '⟨' : '⟩'}
            </button>

            {/* 우클릭 메뉴 컨텍스트 */}
            <ContextMenu
                state={contextMenu}
                onClose={() => setContextMenu({ visible: false })}
                onDeleteNote={handleDeleteNote}
                onCreateNote={handleCreateNote}
            />
        </div>
    );
};