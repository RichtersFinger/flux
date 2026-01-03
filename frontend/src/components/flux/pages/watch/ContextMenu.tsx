import { FiCheck } from "react-icons/fi";
import {
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPlayBack,
  IoPlayForward,
} from "react-icons/io5";

import type { RecordInfo } from "../../../../types";
import { useSessionStore } from "../../../../store";
import { useRouter } from "../../../../hooks/Router";
import BaseContextMenu from "../../../base/ContextMenu";
import { getNextVideo, getPreviousVideo } from "./videoNavigation";

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
  const { navigate } = useRouter();
  const { userConfiguration, putUserConfiguration } = useSessionStore();

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
                    navigate(
                      undefined,
                      new URLSearchParams({
                        id: getPreviousVideo(recordInfo, videoId ?? ""),
                      })
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
                    navigate(
                      undefined,
                      new URLSearchParams({
                        id: getNextVideo(recordInfo, videoId ?? ""),
                      })
                    );
                    close();
                  },
                },
              ]
            : []),
          {
            id: "slower",
            content: (
              <BaseContextMenu.BasicItem icon={<IoPlayBack size={20} />}>
                Slower
              </BaseContextMenu.BasicItem>
            ),
            disabled: playbackRate < 0.45,
            onClick: () => setPlaybackRate((state) => state - 0.2),
          },
          {
            id: "faster",
            content: (
              <BaseContextMenu.BasicItem icon={<IoPlayForward size={20} />}>
                Faster
              </BaseContextMenu.BasicItem>
            ),
            disabled: playbackRate > 1.95,
            onClick: () => setPlaybackRate((state) => state + 0.2),
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
