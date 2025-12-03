import { useSessionStore } from "../../../../store";
import Avatar from "../../../base/Avatar";
import Logo from "../../../base/Logo";

export default function Header() {
  const { userConfiguration } = useSessionStore();
  return (
    <div className="fixed px-1 w-full h-toolbar flex flex-row justify-between items-center z-50 bg-linear-to-r from-gray-800 via-gray-900 to-gray-900 shadow-2xl border-b border-gray-900">
      {/* logo */}
      <div className="mx-2">
        <Logo className="text-gray-100" src="/favicon.svg" text="flux" />
      </div>
      {/* tools */}
      <div>
        <input
          type="text"
          className="bg-gray-100 text-gray-900 rounded px-2 py-1"
          placeholder="Search ..."
        />
      </div>
      {/* user */}
      <Avatar username={userConfiguration.user?.name} />
    </div>
  );
}
