// src/components/common/addRecommendButton/AddRecommendButton.tsx
import { Star } from 'lucide-react';
import './AddRecommendButton.css';

interface Props {
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function AddRecommendButton({ active, onClick }: Props) {
  return (
    <button
      className={`add-recommend-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label="즐겨찾기"
    >
      <Star size={14} />
    </button>
  );
}
