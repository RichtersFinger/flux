interface PlaceholderBoxProps {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export default function PlaceholderBox({
  className = "",
  onClick,
}: PlaceholderBoxProps) {
  return (
    <div
      className={`bg-gray-900 border-gray-700 border-2 border-opacity-0 ${className}`}
      onClick={onClick}
    >
      <div className="overflow-clip relative h-full w-full">
        <div className="absolute bg-white -top-10 blur-lg placeholder-box-bar" />
      </div>
    </div>
  );
}
