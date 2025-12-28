import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiRotateCcw,
  FiRotateCw,
  FiVolumeX,
  FiVolume,
  FiVolume1,
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
import { throttle } from "../../../../util/events";
import { useToaster } from "../../../base/Toaster";
import type {
  APIResponse,
  CollectionInfo,
  RecordInfo,
  SeriesInfo,
  VideoInfo,
} from "../../../../types";
import { useSessionStore } from "../../../../store";

function convertToHumanReadableTime(
  seconds: number,
  includeHours: boolean = true
) {
  const hoursSegment = includeHours ? `${Math.round(seconds / 3600)}:` : "";
  return `${hoursSegment}${Math.round((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${Math.round(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

const DEFAULT_ICON_BUTTON_STYLE =
  "opacity-50 hover:opacity-70 hover:cursor-pointer hover:scale-110 transition-all";

export default function Watch() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(undefined);
  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined
  );
  const [videoError, setVideoError] = useState<string | undefined>(undefined);
  const [paused, setPaused] = useState<boolean | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [mousedownOnCurrentTimeSlider, setMousedownOnCurrentTimeSlider] =
    useState(false);
  const [draggingCurrentTimeSlider, setDraggingCurrentTimeSlider] =
    useState(false);

  const hideToolbar = useRef(true);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(undefined);

  const { userConfiguration, putUserConfiguration } = useSessionStore();

  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();
  const videoId = search?.get("id") ?? undefined;
  useTitle(`flux | ${recordInfo?.name ?? videoId ?? "Watch"}`);

  // handle play/pause
  useEffect(() => {
    if (mousedownOnCurrentTimeSlider) {
      videoRef.current?.pause();
      return;
    }
    if (paused) videoRef.current?.pause();
    else videoRef.current?.play();
  }, [paused, mousedownOnCurrentTimeSlider]);

  // handle seek
  useEffect(() => {
    if (mousedownOnCurrentTimeSlider || !videoRef.current) return;
    videoRef.current.currentTime = currentTime;
    // eslint-disable-next-line
  }, [mousedownOnCurrentTimeSlider]);

  // user seeking video position by dragging should be throttled to
  // avoid excessive state updates/re-renders
  const throttledSetCurrentTime = useMemo(() => {
    return throttle((currentTime) => {
      setCurrentTime(currentTime as number);
    }, 16);
  }, [setCurrentTime]);

  // setup event listeners on toolbar
  const setupToolbarEvents = useCallback((node: HTMLDivElement) => {
    toolbarRef.current = node;
    if (!toolbarRef.current) return;

    function handleMouseEnter() {
      hideToolbar.current = false;
    }
    function handleMouseLeave() {
      hideToolbar.current = true;
    }

    toolbarRef.current.addEventListener("mouseenter", handleMouseEnter);
    toolbarRef.current.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      toolbarRef.current?.removeEventListener("mouseenter", handleMouseEnter);
      toolbarRef.current?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // setup event listeners on video
  const setupVideoEvents = useCallback(
    (node: HTMLVideoElement) => {
      if (!node) return;
      // setup ref for HTML-element
      videoRef.current = node;

      // apply configuration
      let previousTimeUpdate = 0;
      const TIMEUPDATE_RATE = 5; // in seconds
      function handleVideoTimeupdate() {
        setCurrentTime(node.currentTime);
        if (
          recordInfo &&
          videoId &&
          node.currentTime > previousTimeUpdate + TIMEUPDATE_RATE
        ) {
          pFetch(`/api/v0/playback/${recordInfo.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: { videoId: videoId, timestamp: node.currentTime },
            }),
          });
          previousTimeUpdate = Math.round(node.currentTime);
        }
      }
      node.volume = (userConfiguration.settings?.volume ?? 100) / 100;
      node.muted = userConfiguration.settings?.muted ?? false;

      // setup event handlers
      // * toolbar fading
      let toolbarFadeout: number | undefined;
      function handleOnMouseMove() {
        if (!toolbarRef.current) return;
        clearTimeout(toolbarFadeout);
        toolbarRef.current.classList.remove("opacity-0");
        toolbarRef.current.classList.add("opacity-100");
        document.body.style.cursor = "";
        toolbarFadeout = setTimeout(() => {
          if (!toolbarRef.current || !hideToolbar.current) return;
          toolbarRef.current.classList.remove("opacity-100");
          toolbarRef.current.classList.add("opacity-0");
          document.body.style.cursor = "none";
        }, 2000);
      }
      // * error
      function handleOnVideoError() {
        setVideoError(
          "An unknown error occurred. This is most likely caused by a video format which does not support streaming."
        );
      }
      // * video ended/start next
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
      document.addEventListener("mousemove", handleOnMouseMove);
      handleOnMouseMove();
      node.addEventListener("ended", handleOnVideoEnded);
      node.addEventListener("error", handleOnVideoError);
      node.addEventListener("timeupdate", handleVideoTimeupdate);
      return () => {
        document.removeEventListener("mousemove", handleOnMouseMove);
        clearTimeout(toolbarFadeout);
        node.removeEventListener("ended", handleOnVideoEnded);
        node.removeEventListener("error", handleOnVideoError);
        node.removeEventListener("timeupdate", handleVideoTimeupdate);
      };
    },
    [userConfiguration.settings, videoId, recordInfo, navigate]
  );

  // setup event listeners on video
  const setupBackButtonEvents = useCallback((node: HTMLDivElement) => {
    if (!node) return;

    // setup event handlers
    // * toolbar fading
    let buttonFadeout: number | undefined;
    function handleOnMouseMove() {
      console.log(node);
      clearTimeout(buttonFadeout);
      node.classList.remove("opacity-0");
      node.classList.add("opacity-100");
      buttonFadeout = setTimeout(() => {
        node.classList.remove("opacity-100");
        node.classList.add("opacity-0");
      }, 2000);
    }
    document.addEventListener("mousemove", handleOnMouseMove);
    handleOnMouseMove();
    return () => {
      document.removeEventListener("mousemove", handleOnMouseMove);
      clearTimeout(buttonFadeout);
    };
  }, []);

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
    <div
      className="relative w-full h-full bg-gray-950"
      onMouseMove={(e) => {
        if (mousedownOnCurrentTimeSlider) {
          setDraggingCurrentTimeSlider(true);
          throttledSetCurrentTime(
            Math.round(
              (e.clientX / e.currentTarget.clientWidth) *
                (videoRef.current?.duration ?? 0)
            )
          );
        }
      }}
      onMouseUp={(e) => {
        if (mousedownOnCurrentTimeSlider)
          setCurrentTime(
            (e.clientX / e.currentTarget.clientWidth) *
              (videoRef.current?.duration ?? 0)
          );
        setMousedownOnCurrentTimeSlider(false);
        setDraggingCurrentTimeSlider(false);
      }}
    >
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
      {/* back to browse */}
      <div
        ref={setupBackButtonEvents}
        className="z-20 absolute left-3 top-3 text-white transition-opacity"
      >
        <div
          className={DEFAULT_ICON_BUTTON_STYLE}
          onClick={() => {
            navigate("/browse", new URLSearchParams());
          }}
        >
          <FiArrowLeft size={30} />
        </div>
      </div>
      {/* play/pause on video */}
      {paused !== undefined && (
        <div
          className={`z-10 absolute left-1/2 top-1/2 -translate-1/2 text-white ${DEFAULT_ICON_BUTTON_STYLE}`}
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
        <div
          ref={setupToolbarEvents}
          className="absolute bottom-0 left-0 h-20 w-screen z-20 bg-black/80 select-none transition-all"
        >
          <div
            className="relative h-0 overflow-y-visible w-full -translate-y-1/2 hover:cursor-pointer transition-all"
            onMouseDown={(e) => {
              setMousedownOnCurrentTimeSlider(true);
              setCurrentTime(
                (e.clientX / e.currentTarget.clientWidth) *
                  (videoRef.current?.duration ?? 0)
              );
            }}
          >
            <div className="absolute top-0 left-0 bg-gray-700 h-2 w-full" />
            <div
              className={`absolute top-0 left-0 bg-blue-700 aspect-square w-4 hover:w-5 rounded-full -translate-x-1/2 -translate-y-1/4 ${
                draggingCurrentTimeSlider ? "" : "transition-all"
              }`}
              style={{
                marginLeft: `${
                  (currentTime / (videoRef.current?.duration ?? 0)) * 100 // eslint-disable-line react-hooks/refs
                }%`,
              }}
            />
            <div
              className={`absolute top-0 left-0 bg-blue-700 h-2 hover:h-2 ${
                draggingCurrentTimeSlider ? "" : "transition-all"
              }`}
              style={{
                width: `${
                  (currentTime / (videoRef.current?.duration ?? 0)) * 100 // eslint-disable-line react-hooks/refs
                }%`,
              }}
            />
          </div>
          <div className="flex flex-row items-center justify-between pb-2 pt-5 px-4 text-white">
            <div className="h-full flex flex-row items-center space-x-10">
              <div
                className={DEFAULT_ICON_BUTTON_STYLE}
                onClick={() => setPaused((state) => !state)}
              >
                {paused ? <IoPlay size={30} /> : <IoPause size={30} />}
              </div>
              <div className="">
                <span className="">
                  {convertToHumanReadableTime(
                    currentTime,
                    (videoRef.current?.duration ?? 0) > 3600 // eslint-disable-line react-hooks/refs
                  )}
                  {" / "}
                  {convertToHumanReadableTime(
                    videoRef.current?.duration ?? 0, // eslint-disable-line react-hooks/refs
                    (videoRef.current?.duration ?? 0) > 3600 // eslint-disable-line react-hooks/refs
                  )}
                </span>
              </div>
              <div className="flex flex-row space-x-5">
                <div className={DEFAULT_ICON_BUTTON_STYLE}>
                  <FiRotateCcw size={25} />
                </div>
                <div className={DEFAULT_ICON_BUTTON_STYLE}>
                  <FiRotateCw size={25} />
                </div>
              </div>
              <div className="flex flex-col space-y-1 text-nowrap max-w-96">
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
                <div
                  onClick={() => {
                    putUserConfiguration({
                      muted: !userConfiguration.settings?.muted,
                    });
                  }}
                >
                  {userConfiguration.settings?.muted ? (
                    <FiVolumeX size={30} />
                  ) : (userConfiguration.settings?.volume ?? 0) < 33 ? (
                    <FiVolume size={30} />
                  ) : (userConfiguration.settings?.volume ?? 0) < 66 ? (
                    <FiVolume1 size={30} />
                  ) : (
                    <FiVolume2 size={30} />
                  )}
                </div>
                <input
                  type="range"
                  value={userConfiguration.settings?.volume ?? 0}
                  onChange={(e) => {
                    // TODO: fix dragging causes many API-requests
                    putUserConfiguration({
                      volume: Number(e.target.value),
                    });
                  }}
                />
              </div>
              <div className={DEFAULT_ICON_BUTTON_STYLE}>
                <IoPlaySkipBack size={25} />
              </div>
              <div className={DEFAULT_ICON_BUTTON_STYLE}>
                <IoPlaySkipForward size={25} />
              </div>
              <div className={DEFAULT_ICON_BUTTON_STYLE}>
                <FiMenu size={25} />
              </div>
              <div
                className={DEFAULT_ICON_BUTTON_STYLE}
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
        </div>
      ) : null}
    </div>
  );
}
