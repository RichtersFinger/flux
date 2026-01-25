import { useRef } from "react";

import { useLocation } from "../../../../hooks/Router";
import { useTitle } from "../../../../hooks/Title";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function LoginRegister() {
  const panelRef = useRef<HTMLDivElement>(null);
  const { search } = useLocation();

  useTitle("flux | Login");

  // animate shaking-animation for panel
  function shakePanel() {
    panelRef.current?.animate(
      [
        { transform: `translateX(-10px)` },
        { transform: `translateX(10px)` },
        { transform: `translateX(0px)` },
      ],
      150,
    );
  }

  return (
    <div
      className="h-screen w-screen flex flex-row items-center justify-center relative"
      style={{
        backgroundImage: `url(banner_nologo.jpg)`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        boxShadow: "inset 0 0 20em 5em #000",
      }}
    >
      <div
        ref={panelRef}
        className="z-10 w-96 rounded-xl bg-[rgba(0,0,0,0.8)] shadow-2xl p-8 text-gray-200 select-none"
      >
        {search?.get("mode") === "register" ? (
          <RegisterForm onError={shakePanel} />
        ) : (
          <LoginForm onError={shakePanel} />
        )}
      </div>
    </div>
  );
}
