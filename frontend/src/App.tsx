import Logo from "./components/Logo";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-auto">
      {/* toolbar */}
      <div className="fixed w-full h-toolbar flex flex-row justify-between items-center bg-gradient-to-r from-gray-800 via-gray-900 to-gray-900 shadow-2xl">
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
      {/* content */}
      <div className="mt-toolbar">
        <div className="h-full flex flex-col px-3 py-6 space-y-4">
          {/* category 1 */}
          <div>
            <h5 className="text-3xl font-bold text-gray-100">
              Continue watching ...
            </h5>
            <div className="grid grid-flow-row grid-cols-5 p-2">
              <div className="m-2 bg-gray-100 rounded-lg hover:shadow-xl hover:cursor-pointer hover:border-2 hover:scale-[1.02] aspect-video transition-transform" />
            </div>
          </div>
          {/* category 2 */}
          <div>
            <h5 className="text-3xl font-bold text-gray-100">Watch next ...</h5>
            <div className="grid grid-flow-row grid-cols-5 p-2">
              <div className="m-2 bg-gray-100 rounded-lg hover:shadow-xl hover:cursor-pointer hover:border-2 hover:scale-[1.02] aspect-video transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
