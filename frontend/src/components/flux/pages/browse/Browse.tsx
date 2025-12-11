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
          query={
            "/api/v0/index/records?" +
            new URLSearchParams({ range: "0-5" }).toString()
          }
        />
        <Content title="Watch next ..." query="" />
        <Content
          title="No content ..."
          query={
            "/api/v0/index/records?" +
            new URLSearchParams({ range: "0-0" }).toString()
          }
        />
      </div>
    </>
  );
}
