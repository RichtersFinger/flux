import { FiEdit3, FiTrash } from "react-icons/fi";

import { useSessionStore } from "../../../../store";
import { useTitle } from "../../../../hooks/Title";
import Content from "./Content";
import Header from "./Header";
import type { RecordMetadata } from "../../../../types";

export default function Browse() {
  useTitle("flux | Browse");
  const { userConfiguration } = useSessionStore();

  const adminEditOption = userConfiguration.user?.isAdmin
    ? [
        {
          id: "edit",
          node: <FiEdit3 size={15} />,
          getOnClick: (record: RecordMetadata) => {
            return (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(record);
            };
          },
        },
      ]
    : [];

  return (
    <>
      <Header />
      <div className="mt-toolbar h-[calc(100%-var(--spacing-toolbar))] flex flex-col px-3 py-6 space-y-4 overflow-y-auto show-dark-scrollbar">
        <Content
          title="Continue watching ..."
          url="/api/v0/index/records"
          params={new URLSearchParams({ continue: "true" })}
          options={[
            ...adminEditOption,
            {
              id: "remove",
              node: <FiTrash size={15} />,
              getOnClick: (record) => {
                return (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(record);
                };
              },
            },
          ]}
        />
        <Content
          title="Series"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "series" })}
          options={[...adminEditOption]}
        />
        <Content
          title="Movies"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "movie" })}
          options={[...adminEditOption]}
        />
        <Content
          title="Collections"
          url="/api/v0/index/records"
          params={new URLSearchParams({ type: "collection" })}
          options={[...adminEditOption]}
        />
      </div>
    </>
  );
}
