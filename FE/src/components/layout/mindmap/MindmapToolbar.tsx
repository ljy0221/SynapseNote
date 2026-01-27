import { Plus, Link, Unlink, Trash2, LayoutGrid } from 'lucide-react'; // 아이콘 임포트
import { MindmapCommonButton } from '../../common/mindmapButton/MindmapCommonButton';
import './MindmapToolbar.css';

/**
 * MindmapToolbarProps 인터페이스
 * Layout 계층으로서 각 기능(Features)에 필요한 핸들러를 Props로 받습니다.
 */
interface MindmapToolbarProps {
    onAdd: () => void;      // 새 노드 생성 기능
    onDelete: () => void;   // 선택된 요소(노드/엣지) 삭제 기능
    onToggleConnectMode: () => void; // 연결 모드 토글
    isConnectMode: boolean; // 연결 모드 활성화 여부
    onToggleDisconnectMode: () => void; // [New] 연결 해제 모드 토글
    isDisconnectMode: boolean; // [New] 연결 해제 모드 활성화 여부
    onAlign: () => void;    // [New] 자동 정렬(Grid Snap) 기능
    isEditMode: boolean;    // 현재 편집 모드 여부 (버튼 활성화 상태 제어)
}

/**
 * 마인드맵 도구 모음 레이아웃 컴포넌트
 */
export const MindmapToolbar: React.FC<MindmapToolbarProps> = ({
    onAdd,
    onDelete,
    onToggleConnectMode,
    isConnectMode,
    onToggleDisconnectMode,
    isDisconnectMode,
    onAlign,
    isEditMode
}) => {
    return (
        <aside className="mindmap-toolbar-layout" aria-label="마인드맵 도구함">
            {/* 상단 섹션: 생성 및 화면 제어 */}
            {/* 모든 도구 버튼을 하나의 섹션으로 통합하여 균일한 간격 유지 */}
            <div className="toolbar-section">
                <MindmapCommonButton
                    icon={<Plus size={20} />}
                    label="새 시냅스 추가"
                    description="새로운 생각의 단위(노드)를 생성하여 아이디어를 확장합니다."
                    onClick={onAdd}
                    isActive={isEditMode}
                />
                <MindmapCommonButton
                    icon={<Link size={20} />}
                    label="연결 모드"
                    description="두 개의 시냅스를 순서대로 클릭하여 관계를 연결합니다."
                    onClick={onToggleConnectMode}
                    isActive={isConnectMode}
                />
                <MindmapCommonButton
                    icon={<Unlink size={20} />}
                    label="연결 해제 모드"
                    description="연결을 끊고 싶은 두 시냅스를 선택하여 관계를 제거합니다."
                    onClick={onToggleDisconnectMode}
                    isActive={isDisconnectMode}
                />
                <MindmapCommonButton
                    icon={<LayoutGrid size={20} />}
                    label="그리드 정렬"
                    description="모든 시냅스를 격자에 맞춰 깔끔하게 자동 정렬합니다."
                    onClick={onAlign}
                // isActive 상태는 굳이 필요 없음 (일회성 동작)
                />
                <MindmapCommonButton
                    icon={<Trash2 size={20} />}
                    label="선택 삭제"
                    description="선택한 시냅스나 연결을 영구적으로 삭제합니다."
                    onClick={onDelete}
                    isDanger={true}
                />
            </div>
        </aside>
    );
};