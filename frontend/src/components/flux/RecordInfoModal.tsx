import { useEffect, useState } from "react";
import { IoPlay } from "react-icons/io5";

import { useLocation, useRouter } from "../../hooks/Router";
import type {
  APIResponse,
  RecordInfo,
  CollectionInfo,
  SeriesInfo,
  VideoInfo,
} from "../../types";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../util/api";
import { useToaster } from "../base/Toaster";
import BaseModal from "../base/BaseModal";
import Button from "../base/Button";

export default function RecordInfoModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();

  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined,
  );

  function fetchRecordInfo() {
    if (!search?.get("recordId")) return;

    pFetch(`/api/v0/index/record/${search.get("recordId")}`)
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<RecordInfo>) => {
        if (json.meta.ok && json.content) {
          setRecordInfo(json.content);
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
  }

  // get record-info
  useEffect(() => {
    fetchRecordInfo();
    // eslint-disable-next-line
  }, [search?.get("recordId")]);

  function formatRecord() {
    if (!recordInfo) return "";

    switch (recordInfo.type) {
      case "movie":
        return "Movie";
      case "collection": {
        const numberOfVideos = (recordInfo.content as CollectionInfo).length;
        return `Collection • ${numberOfVideos} video${numberOfVideos === 1 ? "" : "s"}`;
      }
      case "series": {
        const numberOfSeasons = (recordInfo.content as SeriesInfo).seasons
          .length;
        const numberOfSpecials = (recordInfo.content as SeriesInfo).specials
          .length;
        return `Series • ${numberOfSeasons} season${numberOfSeasons === 1 ? "" : "s"} • ${numberOfSpecials} special${numberOfSpecials === 1 ? "" : "s"}`;
      }
    }
  }

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    newSearch.delete("recordId");
    navigate(undefined, newSearch);
  }

  return (
    <BaseModal
      className="p-0! w-2xl max-h-11/12 bg-gray-950 overflow-y-auto show-dark-scrollbar"
      onDismiss={close}
    >
      <div id="record-info-modal-body" className="relative w-full rounded-2xl">
        <div
          className="absolute top-0 left-0 w-full h-96 z-10 bg-gray-950"
          style={{
            backgroundImage: `url(${BASE_URL}/thumbnail/${recordInfo?.thumbnailId})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-96 z-10 bg-gray-950"
          style={{
            background:
              "linear-gradient(0deg, var(--color-gray-950) 15%, rgba(0, 0, 0, 0) 100%)",
          }}
        />
        <div
          ref={(node) => {
            if (!node) return;

            const body = document.getElementById("record-info-modal-body");
            if (!body) return;
            document.getElementById("record-info-modal-body")!.style.height =
              Math.min(
                0.9 * window.innerHeight,
                Math.max(node.clientHeight, 400),
              ) + "px";
          }}
          className="absolute top-16 z-10 w-full p-10 flex flex-col space-y-4"
        >
          <h5 className="text-gray-100 font-semibold text-5xl">
            {recordInfo?.name}
          </h5>
          <p className="text-gray-100">{recordInfo?.description}</p>
          <div className="text-gray-100 italic">{formatRecord()}</div>
          <div>
            <Button
              onClick={() => {
                if (!recordInfo) return;
                pFetch(`/api/v0/index/record/${recordInfo.id}/current-video`)
                  .then((response) => {
                    if (!response.ok) {
                      response.text().then((text) => console.error(text));
                      throw new Error(response.statusText);
                    }
                    return response.json();
                  })
                  .then(
                    (
                      json: APIResponse<{
                        video: VideoInfo;
                        playback?: { timestamp?: number };
                      }>,
                    ) => {
                      if (json.meta.ok && json.content)
                        navigate(
                          "/watch",
                          new URLSearchParams({
                            id: json.content.video.id,
                            t: (
                              json.content.playback?.timestamp ?? 0
                            ).toString(),
                          }),
                        );
                      else toast(formatAPIErrorMessage(json.meta));
                    },
                  )
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
            >
              <div className="flex flex-row items-center space-x-2">
                <IoPlay size={24} />
                <span>Start watching</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
