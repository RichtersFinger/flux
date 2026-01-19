import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BaseModalProps {
  className?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
}

export default function BaseModal({
  className = "",
  children,
  onDismiss,
}: BaseModalProps) {
  const [visible, setVisible] = useState(false);

  // animate show
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return createPortal(
    <div
      className="z-50 fixed bg-[rgba(0,0,0,0.7)] top-0 left-0 h-screen w-screen flex items-center justify-center"
      onClick={onDismiss}
    >
      <div
        className={`flex flex-col p-5 rounded-xl bg-gray-900 text-gray-100 shadow-lg space-y-2 ${className} transition-all duration-150 ease-in ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
