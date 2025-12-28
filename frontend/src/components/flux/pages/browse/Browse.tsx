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
          url="/api/v0/index/records"
          params={new URLSearchParams({ continue: "true" })}
        />
        <Content
          title="Series"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "series" })}
        />
        <Content
          title="Movies"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "movie" })}
        />
        <Content
          title="Collections"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "collection" })}
        />
      </div>
    </>
  );
}
