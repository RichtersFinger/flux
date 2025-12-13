import { useEffect, useState } from "react";
import type { APIResponse, Records } from "../../../../types";
import RecordDisplay from "./RecordDisplay";
import { formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";

interface ContentProps {
  title: string;
  url: string;
  params?: URLSearchParams;
}

export default function Content({ title, url, params }: ContentProps) {
  const { toast } = useToaster();

  const [records, setRecords] = useState<Records | undefined>(undefined);

  useEffect(() => {
    if (url === "") return;

    let discard = false;

    pFetch(
      url +
        "?" +
        new URLSearchParams({
          ...Object.fromEntries(params ?? []),
          range: "0-5",
        }).toString()
    )
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<Records>) => {
        if (discard) return;
        if (json.meta.ok && json.content) setRecords(json.content);
        else toast(formatAPIErrorMessage(json.meta));
      })
      .catch((error) => {
        toast(
          formatAPIErrorMessage({
            error: { code: 0, short: "Connection error", long: error.message },
          })
        );
        console.error(error);
      });
    return () => {
      discard = true;
    };
  }, [url, params, setRecords, toast]);

  if (records?.records?.length === 0) return null;

  return (
    <div className="select-none">
      <h5 className="text-3xl font-bold text-gray-100">{title}</h5>
      <div className="grid grid-flow-row sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-2">
        {records ? (
          records.records.map((item) => (
            <RecordDisplay key={item.id} record={item} />
          ))
        ) : (
          <RecordDisplay />
        )}
      </div>
    </div>
  );
}
