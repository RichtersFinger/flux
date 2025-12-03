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
      className={`relative aspect-square w-12 bg-gray-500 border-gray-200 border-2 text-gray-200 text-3xl rounded-full select-none hover:cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative w-full h-full flex flex-row items-center justify-center font-semibold">
        {username ? username[0].toUpperCase() : "?"}
      </div>
    </div>
  );
}
