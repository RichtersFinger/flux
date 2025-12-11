import { useCallback, useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";

type MenuPosition = "bl" | "br" | "tl" | "tr";

const PositionStyles: Record<MenuPosition, string> = {
  bl: "right-0",
  br: "left-0",
  tl: "right-0 -translate-y-full -top-2",
  tr: "left-0 -translate-y-full -top-2",
};

interface TooltipProps {
  className?: string;
  position?: MenuPosition;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Tooltip({
  className = "",
  position = "bl",
  icon,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // setup event listeners for hide and show
  const measuredRef = useCallback(
    (node: HTMLDivElement) => {
      if (!node) return;
      function handleOnMouseEnter() {
        setOpen(true);
      }
      function handleOnMouseLeave() {
        setOpen(false);
      }
      node.addEventListener("mouseenter", handleOnMouseEnter);
      node.addEventListener("mouseleave", handleOnMouseLeave);
    },
    [setOpen]
  );

  // handle animated visibility via opacity
  // the cascading render caused by setState inside useEffect is
  // intentional: the opacity needs to be changed after the component
  // has been rendered to achieve the fade-in effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setVisible(open), [open]);

  return (
    <div className="relative overflow-visible">
      <div ref={measuredRef} className="hover:cursor-help">
        {icon ?? <FiInfo size={14} />}
      </div>
      {open && (
        <div
          className={`absolute rounded bg-gray-800 text-gray-200 m-1 shadow-xl z-50 transition-opacity duration-1000 ${
            PositionStyles[position]
          } ${visible ? "opacity-100" : "opacity-0"} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
