type SpinnerSize = "xs" | "sm" | "base" | "lg";

const SpinnerSizingStyles = {
  lg: "size-16",
  base: "size-12",
  sm: "size-8",
  xs: "size-5",
};

const SpinnerSizingInnerStyles = {
  lg: "border-8",
  base: "border-[6px]",
  sm: "border-4",
  xs: "border-2",
};

interface SpinnerProps {
  className?: string;
  size?: SpinnerSize;
}

export default function Spinner({ className = "", size = "lg" }: SpinnerProps) {
  return (
    <div className={`relative aspect-square ${SpinnerSizingStyles[size]}`}>
      <div className="w-full h-full animate-pulse">
        <div
          className={`w-full h-full aspect-square animate-spin border-transparent border-t-blue-500 rounded-full ${SpinnerSizingInnerStyles[size]} ${className}`}
        ></div>
      </div>
    </div>
  );
}
