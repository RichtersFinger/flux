export interface BaseOverlayProps {
  open: boolean;
  children?: React.ReactNode;
  onDismiss?: () => void;
  content?: React.ReactNode;
}

export default function BaseOverlay({
  open,
  children,
  content,
  onDismiss,
}: BaseOverlayProps) {
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
      {content}
    </div>
  );
}
