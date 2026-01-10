import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { IoPlay, IoPause, IoPlaySkipForward } from "react-icons/io5";

import { useLocation, useRouter } from "../../../../hooks/Router";
import { useTitle } from "../../../../hooks/Title";
import { hideElement, showElement } from "../../../../util/animations";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { throttle } from "../../../../util/events";
import { DEFAULT_ICON_BUTTON_STYLE } from "../../../../util/styles";
import { useToaster } from "../../../base/Toaster";
import type { APIResponse, RecordInfo, VideoInfo } from "../../../../types";
import { useSessionStore } from "../../../../store";
import Spinner from "../../../base/Spinner";
import { getNextVideo, useNavigateToVideo } from "./videoNavigation";
import Toolbar from "./Toolbar";
import ContextMenu from "./ContextMenu";

export default function Watch() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(undefined);
  const [recordInfo, setRecordInfo] = useState<RecordInfo | undefined>(
    undefined
  );
  const [videoError, setVideoError] = useState<string | undefined>(undefined);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [paused, setPaused] = useState<boolean | undefined>(undefined);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [mousedownOnCurrentTimeSlider, setMousedownOnCurrentTimeSlider] =
    useState(false);
  const [draggingCurrentTimeSlider, setDraggingCurrentTimeSlider] =
    useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<number[]>([
    0, 0,
  ]);

  const shouldHideUi = useRef(true);
  const [uiHidden, setUiHidden] = useState<boolean>(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const backToBrowseRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { userConfiguration } = useSessionStore();

  const { navigate } = useRouter();
  const navigateToVideo = useNavigateToVideo();
  const { search } = useLocation();
  const { toast } = useToaster();
  const videoId = search?.get("id") ?? undefined;
  useTitle(`flux | ${recordInfo?.name ?? videoId ?? "Watch"}`);

  const nextVideoId = useMemo(() => {
    if (!recordInfo || !videoId) return;
    const nextVideoId = getNextVideo(recordInfo, videoId);
    if (nextVideoId === videoId) return;
    return nextVideoId;
  }, [recordInfo, videoId]);

  const [currentTime, setCurrentTime] = useState(
    Number(search?.get("t") ?? "0")
  );

  // handle play/pause
  useEffect(() => {
    if (mousedownOnCurrentTimeSlider) {
      videoRef.current?.pause();
      return;
    }
    if (paused) videoRef.current?.pause();
    else videoRef.current?.play();
  }, [paused, mousedownOnCurrentTimeSlider]);

  // handle change in playback rate
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // handle seek
  useEffect(() => {
    if (mousedownOnCurrentTimeSlider || !videoRef.current) return;
    videoRef.current.currentTime = currentTime;
    // eslint-disable-next-line
  }, [mousedownOnCurrentTimeSlider]);

  // handle hidden ui
  useEffect(() => {
    let anim;
    if (uiHidden) {
      anim = hideElement;
      document.body.style.cursor = "none";
    } else {
      anim = showElement;
      document.body.style.cursor = "";
    }
    if (toolbarRef.current) {
      anim(toolbarRef.current);
    }
    if (backToBrowseRef.current) {
      anim(backToBrowseRef.current);
    }
  }, [uiHidden]);

  // trigger to hide ui after video has been changed
  useEffect(() => {
    if (videoLoaded) document.dispatchEvent(new Event("mousemove"));
  }, [videoLoaded]);

  // user seeking video position by dragging should be throttled to
  // avoid excessive state updates/re-renders
  const throttledSetCurrentTime = useMemo(() => {
    return throttle((currentTime) => {
      setCurrentTime(currentTime as number);
    }, 16);
  }, [setCurrentTime]);

  // setup event listeners on video
  const setupVideoEvents = useCallback(
    (node: HTMLVideoElement) => {
      if (!node) return;
      // setup ref for HTML-element
      videoRef.current = node;

      // re-renders of toolbar can be optimized by limiting the rate at
      // which the currentTime is updated
      const throttledSetCurrentTime1 = throttle(() => {
        setCurrentTime(node.currentTime);
      }, 1000);
      const throttledSetCurrentTime5 = throttle(() => {
        setCurrentTime(node.currentTime);
      }, 5000);
      let videoTimeupdateInitialized = false;
      // apply configuration
      let previousTimeUpdate = 0;
      const TIMEUPDATE_RATE = 5; // in seconds
      function handleVideoTimeupdate() {
        // on first call, always update
        if (!videoTimeupdateInitialized) {
          setCurrentTime(node.currentTime);
          videoTimeupdateInitialized = true;
        }
        // later, use throttled updates depending on whether toolbar is
        // visible
        if (!uiHidden) throttledSetCurrentTime1();
        else throttledSetCurrentTime5();
        if (
          recordInfo &&
          videoId &&
          Math.abs(node.currentTime - previousTimeUpdate) > TIMEUPDATE_RATE
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
      // * video loaded
      function handleOnLoad() {
        if (search?.get("t")) {
          node.currentTime = Number(search.get("t"));
          navigate(
            undefined,
            new URLSearchParams({ id: videoId ?? "" }),
            false
          );
        }
        node.play();
        setVideoLoaded(true);
      }
      // * toolbar fading
      let toolbarFadeout: number | undefined;
      // console.log("videocallbacks");
      function handleOnMouseMove() {
        // console.log("move", toolbarRef.current);
        if (!toolbarRef.current) return;
        clearTimeout(toolbarFadeout);
        setUiHidden(false);
        toolbarFadeout = setTimeout(() => {
          if (!toolbarRef.current || !shouldHideUi.current) return;
          setUiHidden(true);
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
          // navigate to next video if available
          navigateToVideo(recordInfo.id, getNextVideo(recordInfo, videoId));
        } else {
          setPaused(true);
          setCurrentTime(videoRef.current?.duration ?? 0);
        }
      }
      node.addEventListener("loadeddata", handleOnLoad);
      document.addEventListener("mousemove", handleOnMouseMove);
      handleOnMouseMove();
      node.addEventListener("ended", handleOnVideoEnded);
      node.addEventListener("error", handleOnVideoError);
      node.addEventListener("timeupdate", handleVideoTimeupdate);
      return () => {
        node.removeEventListener("loadeddata", handleOnLoad);
        document.removeEventListener("mousemove", handleOnMouseMove);
        clearTimeout(toolbarFadeout);
        node.removeEventListener("ended", handleOnVideoEnded);
        node.removeEventListener("error", handleOnVideoError);
        node.removeEventListener("timeupdate", handleVideoTimeupdate);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      search,
      userConfiguration.settings,
      videoId,
      recordInfo,
      navigate,
      navigateToVideo,
    ]
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
    <div
      className={`relative w-full h-full ${
        videoError ? "bg-gray-950" : "bg-black"
      }`}
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
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setContextMenuPosition([e.clientX, e.clientY]);
            setOpenContextMenu(true);
          }}
        />
      )}
      <div
        className={`z-10 absolute left-1/2 top-1/2 -translate-1/2 flex flex-row items-center pointer-events-none transition-opacity duration-500 ${
          videoLoaded || videoError ? "opacity-0" : "opacity-100"
        }`}
      >
        <Spinner size="lg" />
      </div>
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
        ref={backToBrowseRef}
        className="z-20 absolute left-3 top-3 text-white transition-opacity"
      >
        <div
          className={DEFAULT_ICON_BUTTON_STYLE}
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
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
      {/* next in line-button */}
      {!userConfiguration.settings?.autoplay &&
        recordInfo &&
        videoInfo &&
        nextVideoId && (
          <div
            className={`z-20 absolute right-3 top-3 text-white transition-opacity ${
              currentTime + 10 >= (videoRef.current?.duration ?? 10 ** 300)
                ? "opacity-100"
                : "opacity-0"
            }`}
          >
            {currentTime + 10 >= (videoRef.current?.duration ?? 10 ** 300) ? (
              <div
                className={`${DEFAULT_ICON_BUTTON_STYLE} flex flex-row items-center space-x-2`}
                onClick={() => {
                  navigateToVideo(recordInfo.id, nextVideoId);
                }}
              >
                <span className="text-lg font-semibold">Next</span>
                <IoPlaySkipForward size={30} />
              </div>
            ) : null}
          </div>
        )}
      {/* toolbar */}
      {recordInfo && videoInfo && (videoLoaded || videoError) ? (
        <Toolbar
          {...{
            recordInfo,
            videoInfo,
            toolbarRef,
            shouldHideUi,
            videoRef,
            paused,
            setPaused,
            currentTime,
            setCurrentTime,
            playbackRate,
            mousedownOnCurrentTimeSlider,
            setMousedownOnCurrentTimeSlider,
            draggingCurrentTimeSlider,
            setDraggingCurrentTimeSlider,
          }}
        />
      ) : null}
      {/* context menu */}
      {videoId && recordInfo && openContextMenu && (
        <ContextMenu
          open={openContextMenu}
          close={() => setOpenContextMenu(false)}
          contextMenuPosition={contextMenuPosition}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          recordInfo={recordInfo}
          videoId={videoId}
        />
      )}
    </div>
  );
}
