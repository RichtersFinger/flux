import Logo from "./components/Logo";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-auto">
      {/* toolbar */}
      <div className="fixed w-full h-toolbar flex flex-row justify-between items-center bg-gray-900 shadow-xl">
        <div className="mx-2">
          <Logo className="text-gray-300" src="/favicon.svg" text="flux" />
        </div>
        <div>
          <input
            type="text"
            className="bg-gray-100 text-gray-900 rounded px-2 py-1"
            placeholder="Search ..."
          />
        </div>
        <div className="mx-2">
          <div className="bg-gray-100 border-gray-400 border-2 rounded-full w-12 aspect-square" />
        </div>
      </div>
      {/* content */}
      <div className="mt-toolbar">
        <div className="h-full flex flex-col text-gray-100 items-center">
          <span className="p-4">tbd</span>
        </div>
      </div>
    </div>
  );
}
