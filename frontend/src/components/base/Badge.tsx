import { FiX } from "react-icons/fi";

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  onDismiss?: () => void;
}

export default function Badge({
  className = "",
  children,
  onClick,
  onDismiss,
}: BadgeProps) {
  return (
    <div
      className={`flex flex-row space-x-2 items-center pl-3 ${onDismiss ? "pr-2" : "pr-3"} py-0.5 select-none bg-blue-500 text-gray-200 rounded-xl text-nowrap ${onClick ? "hover:cursor-pointer hover:bg-blue-400" : ""} ${className}`}
      onClick={onClick}
    >
      <div>{children}</div>
      {onDismiss ? (
        <div className="hover:cursor-pointer hover:text-white rounded-full hover:bg-blue-400 p-1 transition-colors">
          <FiX size={16} onClick={onDismiss} />
        </div>
      ) : null}
    </div>
  );
}
