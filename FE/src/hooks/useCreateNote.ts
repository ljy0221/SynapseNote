import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/useNoteStore';
import { useAuthStore } from '../store/useAuthStore'; // [1] AuthStore 임포트
import { useToastStore } from '../store/useToastStore';
import { createNoteApi } from '../api/notes/CreateNote.api';
import { generateUuidV7 } from '../utils/UUIDV7';
import { emitNotesChanged } from '../events/NotesEvents';
import type { CreateNoteRequest } from '../types/note/CreateNote';

interface CreateNoteOptions {
    onOptimisticUpdate?: (noteId: string, memberId: string) => void;
    onSuccess?: (noteId: string) => void;
    onError?: (noteId: string) => void;
}

export const useCreateNote = () => {
    const navigate = useNavigate();
    const { canCreateNote, updateLastCreatedTime } = useNoteStore();
    // [2] 컴포넌트 레벨에서 userInfo를 구독하지 않고, 함수 내부에서 getState()로 최신 값을 가져옵니다.

    const { showToast } = useToastStore(); // Toast store hook

    const handleCreateNote = async (
        directoryPath: string = '/',
        options?: CreateNoteOptions
    ) => {
        // 1. 30초 제한 확인
        if (!canCreateNote()) {
            showToast('노트 생성은 30초에 한 번만 가능합니다.', 'warning');
            return;
        }

        const noteId = generateUuidV7();

        // [3] 수정: LocalStorage 대신 Zustand Store에서 memberId 가져오기
        const userInfo = useAuthStore.getState().userInfo;
        const memberId = userInfo?.memberId;

        if (!memberId) {
            console.error('Member ID not found in AuthStore');
            // 만약 스토어에 정보가 없다면 세션이 만료된 것일 수 있으므로 재로그인 유도 등을 고려
            return;
        }

        // Optimistic Update (UI 즉시 반영용 콜백)
        if (options?.onOptimisticUpdate) {
            options.onOptimisticUpdate(noteId, memberId);
        }

        try {
            const newNoteReq: CreateNoteRequest = {
                id: noteId,
                title: '새 노트',
                invitationUrl: '',
                directoryPath,
            };

            await createNoteApi(newNoteReq);
            console.log("노트 생성 성공:", noteId);

            // 2. 생성 성공 시 타임스탬프 업데이트
            updateLastCreatedTime();

            // 3. 페이지 이동 전 딜레이 (DB 반영 대기)
            await new Promise(resolve => setTimeout(resolve, 700));

            // 4. 이벤트 방출 및 네비게이션
            emitNotesChanged({ skipRefetch: true });
            navigate(`/note/${noteId}`);

            if (options?.onSuccess) {
                options.onSuccess(noteId);
            }
        } catch (error) {
            console.error("노트 생성 실패:", error);

            // Rollback (에러 발생 시 처리용 콜백)
            if (options?.onError) {
                options.onError(noteId);
            } else {
                showToast("노트를 생성하지 못했습니다.", 'error');
            }
        }
    };

    return { handleCreateNote };
};