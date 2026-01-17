interface TextInputProps {
  id?: string;
  className?: string;
  value?: string;
  type?: "text" | "password";
  placeholder?: string;
  icon?: React.ReactNode;
  maxLength?: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TextInput({
  id,
  className = "",
  value,
  type = "text",
  placeholder,
  icon,
  maxLength = 256,
  onChange,
}: TextInputProps) {
  return (
    <div className="relative">
      {icon ? (
        <div className="absolute h-full pointer-events-none bg-gray-500 rounded-l noselect">
          <div className="flex flex-row h-full px-2 items-center">{icon}</div>
        </div>
      ) : null}
      <input
        id={id}
        className={`p-1 px-2 border bg-gray-100 rounded ${className} ${
          icon ? "indent-7" : ""
        }`}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={onChange}
      />
    </div>
  );
}
