import { useRef } from "react";

import { useLocation } from "../../../../hooks/Router";
import Logo from "../../../base/Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function LoginRegister() {
  const panelRef = useRef<HTMLDivElement>(null);
  const { search } = useLocation();

  // animate shaking-animation for panel
  function shakePanel() {
    panelRef.current?.animate(
      [
        { transform: `translateX(-10px)` },
        { transform: `translateX(10px)` },
        { transform: `translateX(0px)` },
      ],
      150
    );
  }

  return (
    <div className="h-screen v-screen flex flex-row items-center justify-center relative">
      {/* Background */}
      <Logo className="absolute opacity-20 z-0" size="768" />
      <div
        ref={panelRef}
        className="z-10 w-72 rounded-xl bg-gray-500 shadow-2xl p-2 text-gray-200 select-none"
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
