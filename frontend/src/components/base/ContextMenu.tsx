type MenuPosition = "bl" | "br" | "tl" | "tr";

const PositionStyles: Record<MenuPosition, string> = {
  bl: "right-0",
  br: "left-0",
  tl: "right-0 -translate-y-full -top-2",
  tr: "left-0 -translate-y-full -top-2",
};

interface ContextMenuItem {
  id: string;
  content: string | React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  className?: string;
  open: boolean;
  position?: MenuPosition;
  title?: string | React.ReactNode;
  items?: ContextMenuItem[];
  children?: React.ReactNode;
  onDismiss?: () => void;
}

export default function ContextMenu({
  className = "",
  open,
  position = "bl",
  title,
  items,
  children,
  onDismiss,
}: ContextMenuProps) {
  return (
    <div className="relative overflow-visible">
      {children}
      {
        /* cover entire screen to allow dismissing anywhere outside menu */
        open && onDismiss !== undefined && (
          <div
            className="fixed top-0 left-0 h-screen w-screen"
            onClick={onDismiss}
          />
        )
      }
      {open && (items?.length ?? 0 > 0) && (
        <div
          className={`w-full absolute rounded bg-gray-800 border-gray-400 text-gray-200 border-2 shadow-xl text-nowrap select-none flex flex-col m-1 ${PositionStyles[position]} ${className}`}
        >
          {title ? (
            <div className="px-3 py-2 mb-0 bg-gray-400 text-gray-900">
              {title}
            </div>
          ) : null}
          {items?.map((item) =>
            item.disabled ? (
              <div
                key={item.id}
                className="w-full truncate px-3 py-2 hover:cursor-not-allowed bg-gray-600 text-gray-400"
              >
                {item.content}
              </div>
            ) : (
              <div
                key={item.id}
                className="w-full truncate px-3 py-2 hover:cursor-pointer hover:bg-gray-300 hover:text-gray-800"
                onClick={item.onClick}
              >
                {item.content}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
