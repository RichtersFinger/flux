type ButtonColor = "blue";
const colorStyle: Record<ButtonColor, string> = {
  blue: "bg-blue-900 hover:bg-blue-500 text-gray-200",
};

interface ButtonProps {
  className?: string;
  color?: ButtonColor;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

export default function Button({
  className = "",
  color = "blue",
  disabled = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`p-2 rounded transition-colors select-none h-10 ${
        colorStyle[color]
      } ${className} ${
        disabled
          ? "hover:cursor-not-allowed bg-gray-300 hover:bg-gray-300 text-gray-600"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="w-full flex justify-center">{children}</div>
    </button>
  );
}
