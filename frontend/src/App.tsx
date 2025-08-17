import Content from "./components/flux/Content";
import Header from "./components/flux/Header";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-auto">
      <Header />
      <div className="mt-toolbar">
        <div className="h-full flex flex-col px-3 py-6 space-y-4">
          <Content
            title="Continue watching ..."
            content={[{ id: "z", meta: { name: "My Favorite Show" } }]}
          />
          <Content
            title="Watch next ..."
            content={[
              { id: "a", meta: { name: "Another Show" } },
              { id: "b", meta: { name: "Some Movie" } },
              { id: "c", meta: { name: "Another Movie" } },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
