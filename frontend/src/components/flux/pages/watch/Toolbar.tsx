import { useState } from "react";
import {
  FiRotateCcw,
  FiRotateCw,
  FiVolumeX,
  FiVolume,
  FiVolume1,
  FiVolume2,
  FiMaximize,
  FiMenu,
} from "react-icons/fi";
import { IoPlay, IoPause } from "react-icons/io5";

import { BASE_URL } from "../../../../util/api";
import { DEFAULT_ICON_BUTTON_STYLE } from "../../../../util/styles";
import type { CollectionInfo, RecordInfo, VideoInfo } from "../../../../types";
import { useSessionStore } from "../../../../store";
import ContextMenu from "../../../base/ContextMenu";
import { useRouter } from "../../../../hooks/Router";

/**
 * Converts a time in seconds to a human-readable format.
 * @param seconds Number of seconds
 * @param includeHours whether to include hours-segment
 * @returns formatted time or placeholder '-'
 */
function convertToHumanReadableTime(
  seconds?: number,
  includeHours: boolean = true
) {
  if (seconds === undefined) return "-";
  if (isNaN(seconds)) return "-";
  const hoursSegment = includeHours ? `${Math.round(seconds / 3600)}:` : "";
  return `${hoursSegment}${Math.round((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${Math.round(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

interface ToolbarProps {
  recordInfo: RecordInfo;
  videoInfo: VideoInfo;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  hideToolbar: React.RefObject<boolean>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  paused: boolean | undefined;
  setPaused: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  playbackRate: number;
  mousedownOnCurrentTimeSlider: boolean;
  setMousedownOnCurrentTimeSlider: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  draggingCurrentTimeSlider: boolean;
  setDraggingCurrentTimeSlider: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Toolbar({
  recordInfo,
  videoInfo,
  toolbarRef,
  hideToolbar,
  videoRef,
  paused,
  setPaused,
  currentTime,
  setCurrentTime,
  playbackRate,
  setMousedownOnCurrentTimeSlider,
  draggingCurrentTimeSlider,
}: ToolbarProps) {
  const [openNavigationMenu, setOpenNavigationMenu] = useState(false);

  const { navigate } = useRouter();
  const { userConfiguration, putUserConfiguration } = useSessionStore();

  // setup event listeners on toolbar
  function setupToolbarEvents(node: HTMLDivElement) {
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
  }

  return (
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
            className={`${DEFAULT_ICON_BUTTON_STYLE} relative`}
            onClick={() => setPaused((state) => !state)}
          >
            {paused ? <IoPlay size={30} /> : <IoPause size={30} />}
            {Math.abs(playbackRate - 1.0) > 0.05 && (
              <span className="absolute right-0 bottom-0 text-xs translate-3/4">
                {playbackRate.toPrecision(2)}x
              </span>
            )}
          </div>
          <div>
            <span>
              {convertToHumanReadableTime(
                currentTime,
                (videoRef.current?.duration ?? 0) > 3600 // eslint-disable-line react-hooks/refs
              )}
              {" / "}
              {convertToHumanReadableTime(
                videoRef.current?.duration, // eslint-disable-line react-hooks/refs
                (videoRef.current?.duration ?? 0) > 3600 // eslint-disable-line react-hooks/refs
              )}
            </span>
          </div>
          <div className="flex flex-row space-x-5">
            <div
              className={`${DEFAULT_ICON_BUTTON_STYLE} relative`}
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.currentTime -= 5;
              }}
            >
              <span className="absolute text-xs -translate-3/4">5s</span>
              <FiRotateCcw size={25} />
            </div>
            <div
              className={`${DEFAULT_ICON_BUTTON_STYLE} relative`}
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.currentTime += 5;
              }}
            >
              <span className="absolute text-xs -translate-y-3/4 right-0 translate-x-3/4">
                5s
              </span>
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
          {recordInfo.type === "collection" ? (
            <ContextMenu
              className="min-w-96"
              open={openNavigationMenu}
              position="tl"
              items={(recordInfo.content as CollectionInfo).map((video) => ({
                id: video.id,
                content: (
                  <div
                    className={`flex flex-row space-x-2 items-center p-1 ${
                      video.id === videoInfo.id
                        ? "border-2 border-gray-500"
                        : ""
                    }`}
                    onClick={() => {
                      if (video.id === videoInfo.id) return;
                      navigate(
                        undefined,
                        new URLSearchParams({ id: video.id })
                      );
                    }}
                  >
                    <img
                      className="w-24 aspect-video"
                      src={`${BASE_URL}/thumbnail/${video.thumbnailId}`}
                    />

                    <div className="flex flex-col space-y-1 text-nowrap max-w-72">
                      <div className="block line-clamp-1 truncate">
                        <span className="font-bold">{video.name}</span>
                      </div>
                      <div className="block line-clamp-1 truncate">
                        <span>{video.description}</span>
                      </div>
                    </div>
                  </div>
                ),
              }))}
              onDismiss={() => setOpenNavigationMenu(false)}
            >
              <div
                className={DEFAULT_ICON_BUTTON_STYLE}
                onClick={() => setOpenNavigationMenu((state) => !state)}
              >
                <FiMenu size={25} />
              </div>
            </ContextMenu>
          ) : null}
          <div
            className={DEFAULT_ICON_BUTTON_STYLE}
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
            }}
          >
            <FiMaximize size={30} />
          </div>
        </div>
      </div>
    </div>
  );
}
