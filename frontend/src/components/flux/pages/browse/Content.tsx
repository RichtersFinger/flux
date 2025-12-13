import { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import type { APIResponse, Records } from "../../../../types";
import { formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";
import Spinner from "../../../base/Spinner";
import RecordDisplay from "./RecordDisplay";

const RANGE_INCREMENT = 5;

interface ContentProps {
  title: string;
  url: string;
  params?: URLSearchParams;
}

export default function Content({ title, url, params }: ContentProps) {
  const { toast } = useToaster();

  const [range, setRange] = useState(RANGE_INCREMENT);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Records | undefined>(undefined);

  useEffect(() => {
    if (url === "") return;

    let discard = false;

    pFetch(
      url +
        "?" +
        new URLSearchParams({
          ...Object.fromEntries(params ?? []),
          range: `${records?.records.length ?? 0}-${range}`,
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
        setLoading(false);
        if (discard) return;
        if (json.meta.ok && json.content)
          setRecords(
            (state) =>
              ({
                ...state,
                ...json.content,
                records: [
                  ...(state?.records ?? []),
                  ...(json.content?.records ?? []),
                ],
              } as Records)
          );
        else toast(formatAPIErrorMessage(json.meta));
      })
      .catch((error) => {
        setLoading(false);
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
    // eslint-disable-next-line
  }, [url, params, range, setRecords, setLoading, toast]);

  if (records?.records?.length === 0) return null;

  return (
    <div className="select-none w-full">
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
      {records && records?.count > range ? (
        <div className="relative flex items-center justify-center">
          <div className="border-t border-2 w-32 border-gray-600" />
          <div className="shrink mx-4 flex flex-row text-gray-500 space-x-2 items-center">
            <span>Show more</span>
            {loading ? (
              <div className="p-1 border-2 rounded-full transition-colors bg-gray-900 border-gray-700 text-gray-700">
                <Spinner size="xs" />
              </div>
            ) : (
              <div
                className="p-1 border-2 rounded-full transition-colors bg-gray-900 hover:bg-gray-700 border-gray-700 hover:border-gray-500 text-gray-700 hover:text-gray-500 hover:cursor-pointer"
                onClick={() => {
                  setLoading(true);
                  setRange((state) => state + RANGE_INCREMENT);
                }}
              >
                <FiChevronDown size={20} />
              </div>
            )}
          </div>
          <div className="border-t border-2 w-32 border-gray-600" />
        </div>
      ) : null}
    </div>
  );
}
