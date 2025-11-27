import { useLayoutEffect, useRef, useState } from "react";

interface PlaceholderBoxProps {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export default function PlaceholderBox({
  className = "",
  onClick,
}: PlaceholderBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);

  useLayoutEffect(() => {
    function handleResize() {
      if (!ref.current) return;
      setWidth(ref.current.offsetWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-gray-900 border-gray-700 border-2 border-opacity-0 ${className}`}
      onClick={onClick}
    >
      <div className="overflow-clip relative h-full w-full">
        <div
          className="absolute bg-white -top-10 blur-lg placeholder-box-bar"
          style={
            {
              "--range": `${2.5 * width}px`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
