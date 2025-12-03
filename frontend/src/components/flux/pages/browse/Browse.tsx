import { useTitle } from "../../../../hooks/Title";
import Content from "./Content";
import Header from "./Header";

export default function Browse() {
  useTitle("flux | Browse");

  return (
    <>
      <Header />
      <div className="mt-toolbar h-[calc(100%-var(--spacing-toolbar))] flex flex-col px-3 py-6 space-y-4 overflow-y-auto show-dark-scrollbar">
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
        <Content title="No content ..." content={[]} />
        <Content title="Loading" />
      </div>
    </>
  );
}
