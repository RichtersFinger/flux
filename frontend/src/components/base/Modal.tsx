import BaseModal from "./BaseModal";

interface ModalProps {
  className?: string;
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  onDismiss?: () => void;
}

export default function Modal({
  className = "",
  header,
  body,
  footer,
  onDismiss,
}: ModalProps) {
  return (
    <BaseModal className={className} onDismiss={onDismiss}>
      <div>{header}</div>
      {header && body ? <hr className="text-gray-100" /> : null}
      <div>{body}</div>
      <div>{footer}</div>
    </BaseModal>
  );
}
