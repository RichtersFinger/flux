import { FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { useRouter } from "../../../../hooks/Router";
import type { SeasonInfo, SeriesInfo, VideoInfo } from "../../../../types";
import { BASE_URL } from "../../../../util/api";
import { DEFAULT_ICON_BUTTON_STYLE } from "../../../../util/styles";
import BaseOverlay from "../../../base/BaseOverlay";
import { useMemo, useState } from "react";

function getSeasonIndex(seasonsAndSpecials: SeasonInfo[], videoId: string) {
  for (const [seasonIndex, season] of seasonsAndSpecials.entries()) {
    const index = season.episodes.findIndex(
      (episode) => episode.id === videoId
    );
    if (index > -1) return seasonIndex;
  }
}

interface VideoSelectionForSeriesProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  seriesInfo: SeriesInfo;
  videoInfo: VideoInfo;
}

export default function VideoSelectionForSeries({
  open,
  setOpen,
  seriesInfo,
  videoInfo,
}: VideoSelectionForSeriesProps) {
  const numberOfSeasonsAndSpecials = useMemo(
    () => seriesInfo.seasons.length + (seriesInfo.specials.length > 0 ? 1 : 0),
    [seriesInfo]
  );
  const seasonsAndSpecials = useMemo(
    () => [
      ...seriesInfo.seasons.map((season, index) => ({
        ...season,
        id: `season-${index}`,
        name: `Season ${index + 1}`,
      })),
      { id: "specials", name: "Specials", episodes: seriesInfo.specials },
    ],
    [seriesInfo]
  );
  const initialSeasonIndex = useMemo(
    () => getSeasonIndex(seasonsAndSpecials, videoInfo.id) ?? 0,
    [seasonsAndSpecials, videoInfo.id]
  );

  const [season, setSeason] = useState(initialSeasonIndex);

  const { navigate } = useRouter();

  return (
    <BaseOverlay
      open={open}
      content={
        open && (
          <div className="w-96 h-[80vh] px-2 py-2 absolute overflow-clip show-dark-scrollbar space-y-2 rounded-xl bg-gray-900 text-gray-200 shadow-xl text-nowrap select-none flex flex-col m-1 right-0 -translate-y-full -top-2">
            <div className="flex flex-row items-center justify-between">
              {season < 1 ? (
                <div className="opacity-25">
                  <FiChevronLeft size={30} />
                </div>
              ) : (
                <div
                  className={DEFAULT_ICON_BUTTON_STYLE}
                  onClick={() => setSeason((state) => state - 1)}
                >
                  <FiChevronLeft size={30} />
                </div>
              )}
              <span className="font-bold">
                {seasonsAndSpecials[season].name}
              </span>
              {season >= numberOfSeasonsAndSpecials - 1 ? (
                <div className="opacity-25">
                  <FiChevronRight size={30} />
                </div>
              ) : (
                <div
                  className={DEFAULT_ICON_BUTTON_STYLE}
                  onClick={() => setSeason((state) => state + 1)}
                >
                  <FiChevronRight size={30} />
                </div>
              )}
            </div>
            <div className="overflow-y-auto">
              {seasonsAndSpecials[season].episodes.map((video) => (
                <div
                  key={video.id}
                  className={`flex flex-row space-x-2 items-center rounded p-2 m-1 ${
                    video.id === videoInfo.id
                      ? "outline-2 outline-gray-500"
                      : "hover:cursor-pointer hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    if (video.id === videoInfo.id) return;
                    navigate(undefined, new URLSearchParams({ id: video.id }));
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
