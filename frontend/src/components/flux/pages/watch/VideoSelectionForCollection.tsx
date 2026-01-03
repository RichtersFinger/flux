import { FiMenu } from "react-icons/fi";

import type { CollectionInfo, VideoInfo } from "../../../../types";
import { BASE_URL } from "../../../../util/api";
import { DEFAULT_ICON_BUTTON_STYLE } from "../../../../util/styles";
import BaseOverlay from "../../../base/BaseOverlay";
import { useNavigateToVideo } from "./videoNavigation";

interface VideoSelectionForCollectionProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  recordId: string;
  collectionInfo: CollectionInfo;
  videoInfo: VideoInfo;
}

export default function VideoSelectionForCollection({
  open,
  setOpen,
  recordId,
  collectionInfo,
  videoInfo,
}: VideoSelectionForCollectionProps) {
  const navigateToVideo = useNavigateToVideo();

  return (
    <BaseOverlay
      open={open}
      content={
        open && (
          <div className="w-96 max-h-[80vh] px-2 py-2 absolute overflow-y-auto overflow-x-clip show-dark-scrollbar space-y-2 rounded-xl bg-gray-900 text-gray-200 shadow-xl text-nowrap select-none flex flex-col m-1 right-0 -translate-y-full -top-2">
            {collectionInfo.map((video) => (
              <div
                key={video.id}
                className={`flex flex-row space-x-2 items-center rounded p-2 ${
                  video.id === videoInfo.id
                    ? "border-2 border-gray-500"
                    : "hover:cursor-pointer hover:bg-gray-800"
                }`}
                onClick={() => {
                  if (video.id === videoInfo.id) return;
                  navigateToVideo(recordId, video.id);
                }}
              >
                <img
                  className="w-24 aspect-video"
                  src={`${BASE_URL}/thumbnail/${video.thumbnailId}`}
                />
                <div className="flex flex-col space-y-1 max-w-72 overflow-hidden">
                  <div className="font-bold truncate">
                    <span>{video.name}</span>
                  </div>
                  <div className="text-gray-400 truncate">
                    <span>{video.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      onDismiss={() => setOpen(false)}
    >
      <div
        className={DEFAULT_ICON_BUTTON_STYLE}
        onClick={() => setOpen((state) => !state)}
      >
        <FiMenu size={25} />
      </div>
    </BaseOverlay>
  );
}
