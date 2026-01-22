import "./SidebarActiveButton.css";

interface SidebarActiveButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function SidebarActiveButton({
  onToggle,
}: SidebarActiveButtonProps) {
  return (
    <button className="sidebar-active-btn" onClick={onToggle}>
      ≡
    </button>
  );
}
