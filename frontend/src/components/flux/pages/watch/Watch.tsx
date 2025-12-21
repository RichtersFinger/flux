import { useCallback, useEffect, useState } from "react";

import { useLocation, useRouter } from "../../../../hooks/Router";
import { useTitle } from "../../../../hooks/Title";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";
import type {
  APIResponse,
  CollectionInfo,
  RecordInfo,
  SeriesInfo,
  VideoInfo,
} from "../../../../types";

export default function Watch() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(undefined);
  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined
  );
  const [videoError, setVideoError] = useState<string | undefined>(undefined);

  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();
  const videoId = search?.get("id") ?? undefined;
  useTitle(`flux | ${recordInfo?.name ?? videoId ?? "Watch"}`);

  // setup event listeners for hide and show
  const setupVideoEvents = useCallback(
    (node: HTMLVideoElement) => {
      if (!node) return;
      function handleOnVideoError() {
        setVideoError(
          "An unknown error occurred. This is most likely caused by a video format which does not support streaming."
        );
      }
      function handleOnVideoEnded() {
        if (videoId && recordInfo && !node.loop) {
          // generate list of ids in order
          const videoIds: string[] = [];
          switch (recordInfo.type) {
            case "movie":
              videoIds.push(videoId);
              break;
            case "series":
              for (const season of (recordInfo.content as SeriesInfo).seasons)
                videoIds.push.apply(
                  videoIds,
                  season.episodes.map((video) => video.id)
                );
              videoIds.push.apply(
                videoIds,
                (recordInfo.content as SeriesInfo).specials.map(
                  (video) => video.id
                )
              );
              break;
            case "collection":
              videoIds.push.apply(
                videoIds,
                (recordInfo.content as CollectionInfo).map((video) => video.id)
              );
              break;
          }
          // navigate to next video if available
          navigate(
            undefined,
            new URLSearchParams({
              id: videoIds[videoIds.indexOf(videoId) + 1] ?? videoId,
            }),
            false
          );
        }
      }
      node.addEventListener("ended", handleOnVideoEnded);
      node.addEventListener("error", handleOnVideoError);
      return () => {
        node.removeEventListener("ended", handleOnVideoEnded);
        node.removeEventListener("error", handleOnVideoError);
      };
    },
    [recordInfo]
  );

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
    // eslint-disable-next-line
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
    // eslint-disable-next-line
  }, [videoId]);

  return (
    <div className="relative w-full h-full bg-gray-950">
      {videoInfo?.trackId && (
        <video
          ref={setupVideoEvents}
          className="absolute w-full h-full"
          src={`${BASE_URL}/video/${videoInfo.trackId}`}
          controls
          autoPlay
        />
      )}
      {videoError ? (
        <div className="absolute left-1/2 top-1/2 -translate-1/2 space-y-2 text-white">
          <p className="font-semibold">{videoError}</p>
          <div>
            <h5>Video metadata:</h5>
            <pre>{JSON.stringify(videoInfo, null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
