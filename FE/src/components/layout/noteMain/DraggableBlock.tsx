import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { BlockData } from '../../../pages/note/Note';

interface DraggableBlockProps {
    block: BlockData;
    children: (dragControls: any) => React.ReactNode;
    onDragEnd?: () => void;
}

export const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, children, onDragEnd }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={block}
            id={block.id.toString()}
            dragListener={false} // 핸들로만 드래그 가능하게 설정
            dragControls={dragControls}
            as="div"
            style={{ position: 'relative', listStyle: 'none' }} // 포지셔닝 컨텍스트 확인 및 리스트 스타일 제거
            onDragEnd={onDragEnd}
        >
            {children(dragControls)}
        </Reorder.Item>
    );
};
