import type {
  CollectionInfo,
  RecordInfo,
  SeriesInfo,
  VideoInfo,
} from "../../../../types";

/**
 * Generates an array of video IDs from given record info (in logical order).
 * @param recordInfo record information
 * @returns array containing video identifiers
 */
export function getVideoIdsForRecord(recordInfo: RecordInfo) {
  let videoIds: string[] = [];
  switch (recordInfo.type) {
    case "movie":
      videoIds.push((recordInfo.content as VideoInfo).id);
      break;
    case "series":
      for (const season of (recordInfo.content as SeriesInfo).seasons)
        videoIds = [...videoIds, ...season.episodes.map((video) => video.id)];
      videoIds = [
        ...videoIds,
        ...(recordInfo.content as SeriesInfo).specials.map((video) => video.id),
      ];
      break;
    case "collection":
      videoIds = [
        ...videoIds,
        ...(recordInfo.content as CollectionInfo).map((video) => video.id),
      ];
      break;
  }
  return videoIds;
}

/**
 * Returns ID of previous video (in logical order).
 * @param recordInfo record information
 * @param videoId current video ID
 * @returns Identifier of video that is previous to current videoId.
 */
export function getPreviousVideo(recordInfo: RecordInfo, videoId: string) {
  const videoIds = getVideoIdsForRecord(recordInfo);
  return videoIds[videoIds.indexOf(videoId) - 1] ?? videoId;
}

/**
 * Returns ID of next video (in logical order).
 * @param recordInfo record information
 * @param videoId current video ID
 * @returns Identifier of video that is next in line.
 */
export function getNextVideo(recordInfo: RecordInfo, videoId: string) {
  const videoIds = getVideoIdsForRecord(recordInfo);
  return videoIds[videoIds.indexOf(videoId) + 1] ?? videoId;
}
