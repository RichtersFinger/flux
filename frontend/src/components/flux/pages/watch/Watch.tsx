import { useEffect, useState } from "react";

import { useLocation, useRouter } from "../../../../hooks/Router";
import { useTitle } from "../../../../hooks/Title";
import Navigate from "../../../base/Navigate";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";
import type { APIResponse, RecordInfo, VideoInfo } from "../../../../types";

export default function Watch() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(
    undefined
  );
  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined
  );

  const { navigate } = useRouter();
  const { toast } = useToaster();
  const { search } = useLocation();
  const videoId = search?.get("id");
  useTitle(`flux | ${videoInfo?.name ?? videoId ?? "Watch"}`);

  // get video-info
  useEffect(() => {
    if (!videoId) return;

    pFetch(`/api/v0/index/video/${videoId}`)
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<VideoInfo>) => {
        if (json.meta.ok && json.content) setVideoInfo(json.content);
        else toast(formatAPIErrorMessage(json.meta));
      })
      .catch((error) => {
        toast(
          formatAPIErrorMessage({
            error: {
              code: 0,
              short: "Connection error",
              long: error.message,
            },
          })
        );
        console.error(error);
      });
    setRecordInfo(undefined);
  }, [videoId]);

  // get record-info
  useEffect(() => {
    if (!videoId) return;

    pFetch(`/api/v0/index/record/${videoId}`)
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<RecordInfo>) => {
        if (json.meta.ok && json.content) setRecordInfo(json.content);
        else toast(formatAPIErrorMessage(json.meta));
      })
      .catch((error) => {
        toast(
          formatAPIErrorMessage({
            error: {
              code: 0,
              short: "Connection error",
              long: error.message,
            },
          })
        );
        console.error(error);
      });
    setRecordInfo(undefined);
  }, [videoId]);

  return (
    <div className="relative w-full h-full">
      {
        videoInfo?.trackId && <video className="absolute w-full h-full" src={`${BASE_URL}/video/${videoInfo.trackId}`} controls/>
      }
    </div>
  );
}
