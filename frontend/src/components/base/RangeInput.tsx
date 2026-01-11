import { useEffect, useRef, useState } from "react";

interface RangeInputProps {
  className?: string;
  value?: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
}

/**
 * Controlled RangeInput with values in [0:100].
 * @param onChange is called on mousemove/mousedown (no rate limit)
 * @param onCommit is called on mouseup (after change is locked in -
 * effectively rate limited)
 */
export default function RangeInput({
  className = "",
  value,
  onChange,
  onCommit,
}: RangeInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingSlider, setDraggingSlider] = useState(false);

  function getValue(e: MouseEvent | React.MouseEvent) {
    if (!containerRef.current) return;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((e.clientX - containerRef.current.offsetLeft) /
            containerRef.current.offsetWidth) *
            100
        )
      )
    );
  }

  // setup handlers for mousemove and mouseup on document
  useEffect(() => {
    if (!draggingSlider) return;

    function handleMouseMove(e: MouseEvent) {
      const newValue = getValue(e);
      if (!newValue) return;
      onChange?.(newValue);
    }
    function handleMouseUp() {
      setDraggingSlider(false);
      if (value) onCommit?.(value);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingSlider, setDraggingSlider, onChange, onCommit]);

  return (
    <div
      ref={containerRef}
      className={`w-full relative hover:cursor-pointer ${className}`}
      onMouseDown={(e) => {
        setDraggingSlider(true);
        const newValue = getValue(e);
        if (!newValue) return;
        onChange?.(newValue);
      }}
    >
      <div className="absolute w-full h-2 rounded-lg bg-gray-200 left-1/2 top-1/2 -translate-1/2" />
      <div
        className="absolute h-2 rounded-lg bg-blue-500 left-0 top-1/2 -translate-y-1/2"
        style={{ width: `${value}%` }}
      />
      <div
        className="aspect-square w-5 rounded-full absolute bg-blue-500 left-0 top-1/2 -translate-y-1/2"
        style={{ left: `calc(${value}% - 12px)` }}
      />
    </div>
  );
}
