import Button from "./Button";
import Modal from "./Modal";

interface ConfirmModalProps {
  className?: string;
  header?: React.ReactNode;
  body?: React.ReactNode;
  onDismiss: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  className,
  header,
  body,
  onDismiss,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      className={className}
      header={header}
      body={body}
      footer={
        <div className="w-full flex flex-row items-center justify-between">
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      }
      onDismiss={onDismiss}
    />
  );
}
