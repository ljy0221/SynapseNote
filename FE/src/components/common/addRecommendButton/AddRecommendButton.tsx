// src/common/addRecommendButton/AddRecommendButton.tsx
import React from 'react';
import './AddRecommendButton.css';

interface AddRecommendButtonProps {
  noteId: string;
  isFavorite: boolean; // 🔥 미리 준비
}

const AddRecommendButton: React.FC<AddRecommendButtonProps> = ({
  isFavorite,
}) => {
  return (
    <button
      className={`favorite-btn ${isFavorite ? 'active' : ''}`}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
};
export default AddRecommendButton;
