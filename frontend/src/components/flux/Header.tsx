import Logo from "../base/Logo";

export default function Header() {
  return (
    <div className="fixed w-full h-toolbar flex flex-row justify-between items-center bg-gradient-to-r from-gray-800 via-gray-900 to-gray-900 shadow-2xl border-b border-gray-900">
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
      <div className="mx-2">
        <div className="bg-gray-100 border-gray-500 border-2 rounded-full w-12 aspect-square" />
      </div>
    </div>
  );
}
