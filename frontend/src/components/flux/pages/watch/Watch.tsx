import { useCallback, useEffect, useRef, useState } from "react";
import { IoPlay, IoPause } from "react-icons/io5";

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
import { useSessionStore } from "../../../../store";

export default function Watch() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(undefined);
  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined
  );
  const [videoError, setVideoError] = useState<string | undefined>(undefined);
  const [paused, setPaused] = useState<boolean | undefined>(undefined);

  const { userConfiguration } = useSessionStore();

  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();
  const videoId = search?.get("id") ?? undefined;
  useTitle(`flux | ${recordInfo?.name ?? videoId ?? "Watch"}`);

  // HTML video ref
  const videoRef = useRef<HTMLVideoElement>(undefined);

  // handle play/pause
  useEffect(() => {
    if (paused) videoRef.current?.pause();
    else videoRef.current?.play();
  }, [paused]);

  // setup event listeners for hide and show
  const setupVideoEvents = useCallback(
    (node: HTMLVideoElement) => {
      if (!node) return;
      // setup ref for HTML-element
      videoRef.current = node;

      // apply configuration
      let previousTimeUpdate = 0;
      const TIMEUPDATE_RATE = 5; // in seconds
      function handleVideoTimeupdate() {
        if (node.currentTime > previousTimeUpdate + TIMEUPDATE_RATE) {
          console.log(previousTimeUpdate, node.currentTime);
          previousTimeUpdate = Math.round(node.currentTime);
        }
      }
      node.volume = (userConfiguration.settings?.volume ?? 100) / 100;
      node.muted = userConfiguration.settings?.muted ?? false;

      // setup event handlers
      function handleOnVideoError() {
        setVideoError(
          "An unknown error occurred. This is most likely caused by a video format which does not support streaming."
        );
      }
      function handleOnVideoEnded() {
        if (
          userConfiguration.settings?.autoplay &&
          videoId &&
          recordInfo &&
          !node.loop
        ) {
          // generate list of ids in order
          let videoIds: string[] = [];
          switch (recordInfo.type) {
            case "movie":
              videoIds.push(videoId);
              break;
            case "series":
              for (const season of (recordInfo.content as SeriesInfo).seasons)
                videoIds = [
                  ...videoIds,
                  ...season.episodes.map((video) => video.id),
                ];
              videoIds = [
                ...videoIds,
                ...(recordInfo.content as SeriesInfo).specials.map(
                  (video) => video.id
                ),
              ];
              break;
            case "collection":
              videoIds = [
                ...videoIds,
                ...(recordInfo.content as CollectionInfo).map(
                  (video) => video.id
                ),
              ];
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
      node.addEventListener("timeupdate", handleVideoTimeupdate);
      return () => {
        node.removeEventListener("ended", handleOnVideoEnded);
        node.removeEventListener("error", handleOnVideoError);
        node.removeEventListener("timeupdate", handleVideoTimeupdate);
      };
    },
    [userConfiguration.settings, videoId, recordInfo, navigate]
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
          className="z-0 absolute w-full h-full"
          src={`${BASE_URL}/video/${videoInfo.trackId}`}
          autoPlay
          onClick={() => {
            const fullscreenState = document.fullscreenElement;
            setTimeout(() => {
              // only pause/unpause if this click did not affect the
              // fullscreen-state (double click)
              if (document.fullscreenElement === fullscreenState)
                setPaused((state) => !state);
            }, 200);
          }}
          onDoubleClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
          }}
        />
      )}
      {videoError ? (
        <div className="z-0 absolute left-1/2 top-1/2 -translate-1/2 space-y-2 text-white">
          <p className="font-semibold">{videoError}</p>
          <div>
            <h5>Video metadata:</h5>
            <pre>{JSON.stringify(videoInfo, null, 2)}</pre>
          </div>
        </div>
      ) : null}
      {paused !== undefined && (
        <div
          className="z-10 absolute left-1/2 top-1/2 -translate-1/2 text-white opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all"
          onClick={() => setPaused((state) => !state)}
        >
          {paused ? (
            <div key="play">
              <IoPlay size={40} />
            </div>
          ) : (
            <div
              key="pause"
              className="transition-all"
              ref={(node) => {
                const timeout = setTimeout(() => {
                  node?.classList.add("scale-200");
                  node?.classList.add("opacity-0");
                }, 100);
                return () => clearTimeout(timeout);
              }}
            >
              <IoPause size={40} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
