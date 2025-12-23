import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiRotateCcw,
  FiRotateCw,
  FiVolume2,
  FiMaximize,
  FiMenu,
} from "react-icons/fi";
import {
  IoPlay,
  IoPause,
  IoPlaySkipBack,
  IoPlaySkipForward,
} from "react-icons/io5";

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
            if (videoError) return;
            const fullscreenState = document.fullscreenElement;
            setTimeout(() => {
              // only pause/unpause if this click did not affect the
              // fullscreen-state (double click)
              if (document.fullscreenElement === fullscreenState)
                setPaused((state) => !state);
            }, 200);
          }}
          onDoubleClick={() => {
            if (videoError) return;
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
      {/* play/pause on video */}
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
      {/* toolbar */}
      {!videoError ? (
        <div className="absolute bottom-0 left-0 h-toolbar w-screen z-20 bg-black/80 flex flex-row items-center justify-between pt-4 pb-2 px-4 text-white select-none">
          <div className="h-full flex flex-row items-center space-x-10">
            <div
              className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all"
              onClick={() => setPaused((state) => !state)}
            >
              {paused ? <IoPlay size={30} /> : <IoPause size={30} />}
            </div>
            <div className="flex flex-row space-x-5">
              <div className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all">
                <FiRotateCcw size={25} />
              </div>
              <div className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all">
                <FiRotateCw size={25} />
              </div>
            </div>
            <div className="flex flex-col space-y-2 text-nowrap max-w-96">
              <div className="block line-clamp-1 truncate">
                <span className="font-bold">{recordInfo?.name}</span>
              </div>
              <div className="block line-clamp-1 truncate">
                <span>{videoInfo?.name}</span>
              </div>
            </div>
          </div>
          <div className="h-full flex flex-row items-center space-x-5">
            <div className="h-full opacity-50 hover:opacity-70 hover:cursor-pointer transition-all flex flex-row items-center space-x-2">
              <FiVolume2 size={30} />
              <input type="range"></input>
            </div>
            <div className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all">
              <IoPlaySkipBack size={25} />
            </div>
            <div className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all">
              <IoPlaySkipForward size={25} />
            </div>
            <div className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all">
              <FiMenu size={25} />
            </div>
            <div
              className="opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all"
              onClick={() => {
                if (videoError) return;
                if (document.fullscreenElement) document.exitFullscreen();
                else document.documentElement.requestFullscreen();
              }}
            >
              <FiMaximize size={30} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
