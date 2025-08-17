interface LogoProps {
  src?: string;
  className?: string;
  text?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export default function Logo({
  src = "/favicon.svg",
  className = "",
  text,
  onClick,
}: LogoProps) {
  return (
    <div
      className={`flex p-2 space-x-2 items-center select-none ${className}`}
      onClick={onClick}
    >
      <img src={src} width={50} alt="logo" />
      {text && <span className="font-bold text-xl">{text}</span>}
    </div>
  );
}
