import { useEffect, useRef, useState } from "react";
import { FiAlertOctagon, FiX } from "react-icons/fi";

type MessageBoxColor = "red";
const colorStyle: Record<
  MessageBoxColor,
  { body: string; dismiss: string; icon: React.ReactNode }
> = {
  red: {
    body: "bg-red-800 text-red-300 border border-red-300",
    dismiss: "hover:text-red-100",
    icon: <FiAlertOctagon size={24} />,
  },
};

interface MessageBoxProps {
  className?: string;
  color?: MessageBoxColor;
  icon?: React.ReactNode;
  dismissible?: boolean;
  title?: string;
  body: string;
  onDismiss?: () => void;
}

export default function MessageBox({
  className = "",
  color = "red",
  icon,
  dismissible = true,
  title,
  body,
  onDismiss,
}: MessageBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  // setup event listeners for hover state
  useEffect(() => {
    if (!ref.current) return;

    const div = ref.current;

    function handleMouseEnter() {
      setHovering(true);
    }
    function handleMouseLeave() {
      setHovering(false);
    }
    div.addEventListener("mouseenter", handleMouseEnter);
    div.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      div.removeEventListener("mouseenter", handleMouseEnter);
      div.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [setHovering]);

  return (
    <div
      ref={ref}
      className={`flex flex-row space-x-5 items-start relative p-2 rounded-lg ${colorStyle[color].body} ${className}`}
    >
      <div className="w-6">{icon ?? colorStyle.red.icon}</div>
      <div className="flex flex-col space-y-1 grow">
        <h5 className="font-semibold">{title ?? "A problem occurred:"}</h5>
        <p className="text-sm">{body}</p>
      </div>
      {dismissible ? (
        <div
          className={`absolute right-2 top-2 transition-color transition-opacity hover:cursor-pointer ${
            colorStyle[color].dismiss
          } ${hovering ? "opacity-100" : "opacity-0"}`}
          onClick={onDismiss}
        >
          <FiX size={20} />
        </div>
      ) : null}
    </div>
  );
}
