type ButtonColor = "blue";
const colorStyle: Record<ButtonColor, string> = {
  blue: "bg-blue-900 hover:bg-blue-500 text-gray-200",
};

interface ButtonProps {
  className?: string;
  color?: ButtonColor;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

export default function Button({
  className = "",
  color = "blue",
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`p-2 rounded transition-colors select-none ${colorStyle[color]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
