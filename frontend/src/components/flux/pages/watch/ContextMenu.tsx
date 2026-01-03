import { FiCheck } from "react-icons/fi";
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPlayBack,
  IoPlayForward,
} from "react-icons/io5";

import type { RecordInfo } from "../../../../types";
import { useSessionStore } from "../../../../store";
import BaseContextMenu from "../../../base/ContextMenu";
import {
  getNextVideo,
  getPreviousVideo,
  useNavigateToVideo,
} from "./videoNavigation";
import { useRef } from "react";

const PLAYBACK_RATE_INCREMENT = 0.2;

interface ContextMenuProps {
  contextMenuPosition: number[];
  open: boolean;
  close: () => void;
  videoId: string;
  recordInfo: RecordInfo;
  playbackRate: number;
  setPlaybackRate: React.Dispatch<React.SetStateAction<number>>;
}

export default function ContextMenu({
  contextMenuPosition,
  close,
  videoId,
  recordInfo,
  playbackRate,
  setPlaybackRate,
}: ContextMenuProps) {
  const decreasePlaybackSpeedIndicator = useRef<HTMLDivElement>(null);
  const increasePlaybackSpeedIndicator = useRef<HTMLDivElement>(null);

  const navigateToVideo = useNavigateToVideo();
  const { userConfiguration, putUserConfiguration } = useSessionStore();

  function animatePlaybackSpeedIndicator(
    element: HTMLDivElement & { _animation?: Animation }
  ) {
    if (element._animation) element._animation.cancel();
    element._animation = element.animate(
      [{ transform: "scale(1.75)" }, { transform: "scale(1.0)" }],
      {
        duration: 150,
      }
    );
  }

  return (
    <div
      className="z-20 absolute w-54"
      style={{
        left: contextMenuPosition[0],
        top: contextMenuPosition[1],
      }}
    >
      <BaseContextMenu
        open
        onDismiss={close}
        items={[
          ...(recordInfo && recordInfo.type !== "movie"
            ? [
                {
                  id: "previous",
                  content: (
                    <BaseContextMenu.BasicItem
                      icon={<IoPlaySkipBack size={20} />}
                    >
                      Previous
                    </BaseContextMenu.BasicItem>
                  ),
                  onClick: () => {
                    navigateToVideo(
                      recordInfo.id,
                      getPreviousVideo(recordInfo, videoId ?? "")
                    );
                    close();
                  },
                },
                {
                  id: "next",
                  content: (
                    <BaseContextMenu.BasicItem
                      icon={<IoPlaySkipForward size={20} />}
                    >
                      Next
                    </BaseContextMenu.BasicItem>
                  ),
                  onClick: () => {
                    navigateToVideo(
                      recordInfo.id,
                      getNextVideo(recordInfo, videoId ?? "")
                    );
                    close();
                  },
                },
              ]
            : []),
          {
            id: "slower",
            content: (
              <BaseContextMenu.BasicItem
                icon={
                  <div ref={decreasePlaybackSpeedIndicator}>
                    <IoPlayBack size={20} />
                  </div>
                }
              >
                Slower
              </BaseContextMenu.BasicItem>
            ),
            disabled: playbackRate < 0.45,
            onClick: () => {
              setPlaybackRate(
                (state) =>
                  Math.round(
                    (state - PLAYBACK_RATE_INCREMENT) / PLAYBACK_RATE_INCREMENT
                  ) * PLAYBACK_RATE_INCREMENT
              );
              if (decreasePlaybackSpeedIndicator.current)
                animatePlaybackSpeedIndicator(
                  decreasePlaybackSpeedIndicator.current
                );
            },
          },
          {
            id: "faster",
            content: (
              <BaseContextMenu.BasicItem
                icon={
                  <div ref={increasePlaybackSpeedIndicator}>
                    <IoPlayForward size={20} />
                  </div>
                }
              >
                Faster
              </BaseContextMenu.BasicItem>
            ),
            disabled: playbackRate > 1.95,
            onClick: () => {
              setPlaybackRate(
                (state) =>
                  Math.round(
                    (state + PLAYBACK_RATE_INCREMENT) / PLAYBACK_RATE_INCREMENT
                  ) * PLAYBACK_RATE_INCREMENT
              );
              if (increasePlaybackSpeedIndicator.current)
                animatePlaybackSpeedIndicator(
                  increasePlaybackSpeedIndicator.current
                );
            },
          },
          {
            id: "autoplay-toggle",
            content: (
              <BaseContextMenu.BasicItem
                icon={
                  userConfiguration.settings?.autoplay ? (
                    <FiCheck size={20} />
                  ) : (
                    <div className="h-5 w-5" />
                  )
                }
              >
                {userConfiguration.settings?.autoplay
                  ? "Autoplay enabled"
                  : "Autoplay disabled"}
              </BaseContextMenu.BasicItem>
            ),
            onClick: () => {
              putUserConfiguration({
                autoplay: !userConfiguration.settings?.autoplay,
              });
              close();
            },
          },
        ]}
      />
    </div>
  );
}
