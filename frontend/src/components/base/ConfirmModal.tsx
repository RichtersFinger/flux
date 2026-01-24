import Button from "./Button";
import Modal from "./Modal";
import Spinner from "./Spinner";

interface ConfirmModalProps {
  className?: string;
  header?: React.ReactNode;
  body?: React.ReactNode;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onDismiss?: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  className,
  header,
  body,
  confirmDisabled = false,
  confirmLoading = false,
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
          <Button
            className="min-w-20"
            disabled={confirmDisabled || confirmLoading}
            onClick={onConfirm}
          >
            {confirmLoading ? <Spinner size="xs" /> : "Confirm"}
          </Button>
        </div>
      }
      onDismiss={onDismiss}
    />
  );
}
