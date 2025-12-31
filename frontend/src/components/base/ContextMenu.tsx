import type { BaseOverlayProps } from "./BaseOverlay";
import BaseOverlay from "./BaseOverlay";

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

interface ContextMenuProps extends Omit<BaseOverlayProps, "content"> {
  className?: string;
  position?: MenuPosition;
  title?: string | React.ReactNode;
  items?: ContextMenuItem[];
}

export default function ContextMenu({
  className = "",
  open,
  children,
  onDismiss,
  position = "bl",
  title,
  items,
}: ContextMenuProps) {
  return (
    <BaseOverlay
      open={open}
      onDismiss={onDismiss}
      content={
        open &&
        (items?.length ?? 0 > 0) && (
          <div
            className={`w-full absolute overflow-clip rounded-xl bg-gray-900 text-gray-200 shadow-xl text-nowrap select-none flex flex-col m-1 ${PositionStyles[position]} ${className}`}
          >
            {title ? (
              <div className="px-5 py-3 mb-0 bg-gray-500 text-gray-950">
                {title}
              </div>
            ) : null}
            {items?.map((item) =>
              item.disabled ? (
                <div
                  key={item.id}
                  className="w-full truncate px-5 py-3 hover:cursor-not-allowed bg-gray-600 text-gray-400"
                >
                  {item.content}
                </div>
              ) : (
                <div
                  key={item.id}
                  className="w-full truncate px-5 py-3 transition-colors hover:cursor-pointer hover:bg-gray-800"
                  onClick={item.onClick}
                >
                  {item.content}
                </div>
              )
            )}
          </div>
        )
      }
    >
      {children}
    </BaseOverlay>
  );
}

interface ContextMenuBasicProps {
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

function ContextMenuBasicItem({
  className = "",
  icon,
  children,
}: ContextMenuBasicProps) {
  return (
    <div
      className={`w-full inline-flex items-center ${className}`}
    >
      {icon? <div className="w-5 mr-5 overflow-clip">{icon}</div> : null}
      <span className="text-nowrap truncate">{children}</span>
    </div>
  );
}

ContextMenu.BasicItem = ContextMenuBasicItem;
