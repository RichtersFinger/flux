import { useEffect, useRef, useState } from "react";
import {
  FiRotateCcw,
  FiRotateCw,
  FiVolumeX,
  FiVolume,
  FiVolume1,
  FiVolume2,
  FiMaximize,
} from "react-icons/fi";
import { IoPlay, IoPause } from "react-icons/io5";

import { DEFAULT_ICON_BUTTON_STYLE } from "../../../../util/styles";
import type {
  CollectionInfo,
  RecordInfo,
  SeriesInfo,
  VideoInfo,
} from "../../../../types";
import { useSessionStore } from "../../../../store";
import RangeInput from "../../../base/RangeInput";
import VideoSelectionForCollection from "./VideoSelectionForCollection";
import VideoSelectionForSeries from "./VideoSelectionForSeries";

/**
 * Converts a time in seconds to a human-readable format.
 * @param seconds Number of seconds
 * @param includeHours whether to include hours-segment
 * @returns formatted time or placeholder '-'
 */
function convertToHumanReadableTime(
  seconds?: number,
  includeHours: boolean = true,
) {
  if (seconds === undefined) return "-";
  if (isNaN(seconds)) return "-";
  const hoursSegment = includeHours ? `${Math.floor(seconds / 3600)}:` : "";
  return `${hoursSegment}${Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

function ToolbarProgressBar({
  videoRef,
  currentTime,
  setCurrentTime,
  setMousedownOnCurrentTimeSlider,
  draggingCurrentTimeSlider,
}: Pick<
  ToolbarProps,
  | "videoRef"
  | "currentTime"
  | "setCurrentTime"
  | "setMousedownOnCurrentTimeSlider"
  | "draggingCurrentTimeSlider"
>) {
  const [seeking, setSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  return (
    <div
      className="relative h-0 overflow-y-visible w-full -translate-y-1/2 hover:cursor-pointer transition-all"
      onMouseDown={(e) => {
        setMousedownOnCurrentTimeSlider(true);
        setCurrentTime(
          (e.clientX / e.currentTarget.clientWidth) *
            (videoRef.current?.duration ?? 0),
        );
      }}
      onMouseEnter={() => setSeeking(true)}
      onMouseLeave={() => setSeeking(false)}
      onMouseMove={(e) =>
        setSeekPosition(e.clientX / e.currentTarget.clientWidth)
      }
    >
      {/* bar-background */}
      <div className="absolute bg-gray-700 h-2 w-full" />
      {/* tracer */}
      <div
        className={`absolute bg-blue-700 aspect-square w-4 hover:w-5 rounded-full -translate-x-1/2 -translate-y-1/4 ${
          draggingCurrentTimeSlider ? "" : "transition-all"
        }`}
        style={{
          marginLeft: `${
            (currentTime / (videoRef.current?.duration ?? 0)) * 100 // eslint-disable-line react-hooks/refs
          }%`,
        }}
      />
      {/* seek-time */}
      {seeking && (
        <div
          className="absolute -translate-x-1/2 -translate-y-12 text-gray-100 p-2 rounded-xl bg-black opacity-80"
          style={{
            marginLeft: `max(28px, min(calc(100% - 28px), ${seekPosition * 100}%))`,
          }}
        >
          {convertToHumanReadableTime(
            seekPosition * (videoRef.current?.duration ?? 0), // eslint-disable-line react-hooks/refs
            (videoRef.current?.duration ?? 0) > 3600, // eslint-disable-line react-hooks/refs
          )}
        </div>
      )}
      {/* bar-foreground */}
      <div
        className={`absolute bg-blue-700 h-2 hover:h-2 ${
          draggingCurrentTimeSlider ? "" : "transition-all"
        }`}
        style={{
          width: `${
            (currentTime / (videoRef.current?.duration ?? 0)) * 100 // eslint-disable-line react-hooks/refs
          }%`,
        }}
      />
    </div>
  );
}

function ToolbarProgressText({
  videoRef,
  currentTime,
}: Pick<ToolbarProps, "videoRef" | "currentTime">) {
  return (
    <div>
      <span>
        {convertToHumanReadableTime(
          currentTime,
          (videoRef.current?.duration ?? 0) > 3600, // eslint-disable-line react-hooks/refs
        )}
        {" / "}
        {convertToHumanReadableTime(
          videoRef.current?.duration, // eslint-disable-line react-hooks/refs
          (videoRef.current?.duration ?? 0) > 3600, // eslint-disable-line react-hooks/refs
        )}
      </span>
    </div>
  );
}

function ToolbarPlayPauseButton({
  paused,
  setPaused,
  playbackRate,
}: Pick<ToolbarProps, "paused" | "setPaused" | "playbackRate">) {
  return (
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
  );
}

function ToolbarSkipBackAhead({ videoRef }: Pick<ToolbarProps, "videoRef">) {
  return (
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
  );
}

function ToolbarVideoInfo({
  recordInfo,
  videoInfo,
}: Pick<ToolbarProps, "recordInfo" | "videoInfo">) {
  return (
    <div className="flex flex-col space-y-1 text-nowrap max-w-96">
      <div className="block line-clamp-1 truncate">
        <span className="font-bold">{recordInfo?.name}</span>
      </div>
      <div className="block line-clamp-1 truncate">
        <span>{videoInfo?.name ?? "\u200b"}</span>
      </div>
    </div>
  );
}

function ToolbarVolumeControl({ videoRef }: Pick<ToolbarProps, "videoRef">) {
  const { userConfiguration, putUserConfiguration } = useSessionStore();
  const [volume, setVolume] = useState(userConfiguration.settings?.volume);
  const putVolumeRef = useRef(0);

  // handle volume control via wheel-input
  useEffect(() => {
    function handleScroll(e: WheelEvent) {
      const newVolume = Math.max(
        0,
        Math.min(100, (volume ?? 0) - 20 * Math.sign(e.deltaY)),
      );
      setVolume(newVolume);
      if (videoRef.current) videoRef.current.volume = newVolume / 100;
      clearTimeout(putVolumeRef.current);
      putVolumeRef.current = setTimeout(
        () => putUserConfiguration({ volume: newVolume }),
        1000,
      );
    }
    videoRef.current?.addEventListener("wheel", handleScroll);
    return () => videoRef.current?.removeEventListener("wheel", handleScroll);
  }, [volume, setVolume, putUserConfiguration, videoRef]);

  return (
    <div className="h-full opacity-50 hover:opacity-70 transition-all flex flex-row items-center space-x-2">
      <div
        className="hover:cursor-pointer"
        onClick={() => {
          putUserConfiguration({
            muted: !userConfiguration.settings?.muted,
          });
        }}
      >
        {userConfiguration.settings?.muted ? (
          <FiVolumeX size={30} />
        ) : (volume ?? 0) < 33 ? (
          <FiVolume size={30} />
        ) : (volume ?? 0) < 66 ? (
          <FiVolume1 size={30} />
        ) : (
          <FiVolume2 size={30} />
        )}
      </div>
      <div className="w-32">
        <RangeInput
          value={volume}
          onChange={(volume) => {
            setVolume(volume);
            if (videoRef.current) videoRef.current.volume = volume / 100;
          }}
          onCommit={(volume) => putUserConfiguration({ volume })}
        />
      </div>
    </div>
  );
}

function ToolbarFullscreenButton() {
  return (
    <div
      className={DEFAULT_ICON_BUTTON_STYLE}
      onClick={() => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }}
    >
      <FiMaximize size={30} />
    </div>
  );
}

interface ToolbarProps {
  recordInfo: RecordInfo;
  videoInfo: VideoInfo;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  shouldHideUi: React.RefObject<boolean>;
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
  shouldHideUi,
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
  // setup event listeners on toolbar
  function setupToolbarEvents(node: HTMLDivElement) {
    toolbarRef.current = node;
    if (!toolbarRef.current) return;

    function handleMouseEnter() {
      shouldHideUi.current = false;
    }
    function handleMouseLeave() {
      shouldHideUi.current = true;
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
      className="absolute bottom-0 left-0 h-20 w-screen z-20 bg-black/80 select-none"
    >
      <ToolbarProgressBar
        {...{
          setMousedownOnCurrentTimeSlider,
          setCurrentTime,
          draggingCurrentTimeSlider,
          currentTime,
          videoRef,
        }}
      />
      <div className="flex flex-row items-center justify-between pb-2 pt-5 px-4 text-white">
        <div className="h-full flex flex-row items-center space-x-10">
          <ToolbarPlayPauseButton {...{ paused, setPaused, playbackRate }} />
          <ToolbarProgressText {...{ videoRef, currentTime }} />
          <ToolbarSkipBackAhead {...{ videoRef }} />
          <ToolbarVideoInfo {...{ recordInfo, videoInfo }} />
        </div>
        <div className="h-full flex flex-row items-center space-x-5">
          <ToolbarVolumeControl {...{ videoRef }} />
          {recordInfo.type === "collection" ? (
            <VideoSelectionForCollection
              open={openNavigationMenu}
              setOpen={setOpenNavigationMenu}
              recordId={recordInfo.id}
              collectionInfo={recordInfo.content as CollectionInfo}
              videoInfo={videoInfo}
            />
          ) : null}
          {recordInfo.type === "series" ? (
            <VideoSelectionForSeries
              open={openNavigationMenu}
              setOpen={setOpenNavigationMenu}
              recordId={recordInfo.id}
              seriesInfo={recordInfo.content as SeriesInfo}
              videoInfo={videoInfo}
            />
          ) : null}
          <ToolbarFullscreenButton />
        </div>
      </div>
    </div>
  );
}
