import { useRef } from "react";
import { FiSearch } from "react-icons/fi";

interface TextSearchProps {
  id?: string;
  className?: string;
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
}

export default function TextSearch({
  id,
  className = "",
  initialValue,
  placeholder,
  autoFocus,
  maxLength = 256,
  onChange,
  onFocus,
}: TextSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative group opacity-0 sm:opacity-100 transition-opacity min-w-1/6 max-w-64">
      <input
        ref={inputRef}
        id={id}
        className={`w-full px-2 py-1 bg-gray-100 text-gray-900 rounded outline-2 focus:outline-blue-400 group-hover:outline-blue-400 transition-colors pr-9 ${className}`}
        type="text"
        placeholder={placeholder}
        defaultValue={initialValue}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange?.(inputRef.current?.value ?? "");
        }}
        onFocus={onFocus}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 right-2 hover:cursor-pointer text-gray-500 hover:text-blue-500 transition-colors noselect"
        onClick={() => onChange?.(inputRef.current?.value ?? "")}
      >
        <FiSearch size={20} />
      </div>
    </div>
  );
}
