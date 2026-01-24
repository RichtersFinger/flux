import { useState } from "react";
import { FiEdit3, FiInfo, FiTrash } from "react-icons/fi";

import type { APIResponse, RecordMetadata } from "../../../../types";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";
import { useSessionStore } from "../../../../store";
import { useTitle } from "../../../../hooks/Title";
import { useLocation, useRouter } from "../../../../hooks/Router";
import Badge from "../../../base/Badge";
import Content from "./Content";
import Header from "./Header";
import ConfirmModal from "../../../base/ConfirmModal";

const INDEX_ENDPOINT = "/api/v0/index/records";

export default function Browse() {
  const [continueContentKey, setContinueContentKey] = useState(0);
  const [deleteRecord, setDeleteRecord] = useState<RecordMetadata | undefined>(
    undefined,
  );
  useTitle("flux | Browse");
  const { toast } = useToaster();
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { userConfiguration } = useSessionStore();

  const infoOption = [
    {
      id: "info",
      node: <FiInfo size={15} />,
      getOnClick: (record: RecordMetadata) => {
        return (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const newSearch = new URLSearchParams(search);
          newSearch.set("m", "show-record");
          newSearch.set("recordId", record.id);
          navigate(undefined, newSearch);
        };
      },
    },
  ];
  const adminEditOption = userConfiguration.user?.isAdmin
    ? [
        {
          id: "edit",
          node: <FiEdit3 size={15} />,
          getOnClick: (record: RecordMetadata) => {
            return (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              const newSearch = new URLSearchParams(search);
              newSearch.set("m", "edit-record");
              newSearch.set("recordId", record.id);
              navigate(undefined, newSearch);
            };
          },
        },
      ]
    : [];

  return (
    <>
      {deleteRecord ? (
        <ConfirmModal
          header={
            <h5 className="text-lg font-bold">{`Remove '${deleteRecord.name}'?`}</h5>
          }
          body={
            <div className="py-2 flex flex-col items-start">
              <p>
                Do you really want to clear the progress on the following
                record?
              </p>
              <div className="w-full flex flex-row items-start m-4 space-x-2">
                <div className="relative w-64 rounded-xl border-gray-700 border-2 aspect-video overflow-clip">
                  <img
                    className="absolute left-1/2 top-1/2 -translate-1/2"
                    src={`${BASE_URL}/thumbnail/${deleteRecord.thumbnailId}`}
                  />
                </div>
                <div className="h-32 max-w-96">
                  <h5 className="text-gray-100 font-semibold text-xl  truncate">
                    {deleteRecord.name}
                  </h5>
                  <div className="w-full">
                    <p className="text-gray-500 line-clamp-5">
                      {deleteRecord.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
          onCancel={() => setDeleteRecord(undefined)}
          onConfirm={() => {
            pFetch(`/api/v0/playback/${deleteRecord.id}`, {
              method: "DELETE",
            })
              .then((response) => {
                if (!response.ok) {
                  response.text().then((text) => console.error(text));
                  throw new Error(response.statusText);
                }
                return response.json();
              })
              .then((json: APIResponse) => {
                if (json.meta.ok) {
                  setDeleteRecord(undefined);
                  setContinueContentKey(Date.now());
                } else toast(formatAPIErrorMessage(json.meta));
              })
              .catch((error) => {
                toast(
                  formatAPIErrorMessage({
                    error: {
                      code: 0,
                      short: "Connection error",
                      long: error.message,
                    },
                  }),
                );
                console.error(error);
              });
          }}
          onDismiss={() => setDeleteRecord(undefined)}
        />
      ) : null}
      <Header />
      <div
        key={
          // reload content when search-filter changes
          search?.get("search") ?? ""
        }
        className="mt-toolbar h-[calc(100%-var(--spacing-toolbar))] flex flex-col px-3 py-6 space-y-4 overflow-y-auto show-dark-scrollbar"
      >
        {search?.get("search") && search.get("search") !== "" ? (
          <div className="flex flex-row">
            <Badge
              onDismiss={() => {
                const newSearch = new URLSearchParams(search);
                newSearch.delete("search");
                navigate(undefined, newSearch);
              }}
            >
              <span className="font-semibold">Text filter</span>
            </Badge>
          </div>
        ) : null}
        <Content
          key={continueContentKey}
          title="Continue watching ..."
          url={INDEX_ENDPOINT}
          params={
            new URLSearchParams({
              continue: "true",
              ...(search?.get("search")
                ? { search: search.get("search")! }
                : {}),
            })
          }
          options={[
            ...infoOption,
            ...adminEditOption,
            {
              id: "remove",
              node: <FiTrash size={15} />,
              getOnClick: (record) => {
                return (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteRecord(record);
                };
              },
            },
          ]}
        />
        <Content
          title="Series"
          url={INDEX_ENDPOINT}
          params={
            new URLSearchParams({
              type: "series",
              ...(search?.get("search")
                ? { search: search.get("search")! }
                : {}),
            })
          }
          options={[...infoOption, ...adminEditOption]}
        />
        <Content
          title="Movies"
          url={INDEX_ENDPOINT}
          params={
            new URLSearchParams({
              type: "movie",
              ...(search?.get("search")
                ? { search: search.get("search")! }
                : {}),
            })
          }
          options={[...infoOption, ...adminEditOption]}
        />
        <Content
          title="Collections"
          url={INDEX_ENDPOINT}
          params={
            new URLSearchParams({
              type: "collection",
              ...(search?.get("search")
                ? { search: search.get("search")! }
                : {}),
            })
          }
          options={[...infoOption, ...adminEditOption]}
        />
      </div>
    </>
  );
}
