interface AvatarProps {
  className?: string;
  username?: string;
  onClick?: () => void;
}

export default function Avatar({
  className = "",
  username,
  onClick,
}: AvatarProps) {
  return (
    <div
      className={`aspect-square w-12 bg-gray-800 border-gray-500 border-2 text-gray-200 text-3xl rounded-full select-none ${onClick ? "hover:text-white hover:border-blue-400 hover:shadow-xs hover:shadow-blue-300 transition-colors hover:cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="w-full h-full flex flex-row items-center justify-center font-semibold -translate-y-0.25">
        {username ? username[0].toUpperCase() : "?"}
      </div>
    </div>
  );
}
