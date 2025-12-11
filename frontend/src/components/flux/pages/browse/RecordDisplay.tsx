import type { RecordMetadata } from "../../../../types";
import { BASE_URL } from "../../../../util/api";
import PlaceholderBox from "../../../base/PlaceholderBox";

interface RecordDisplayProps {
  record?: RecordMetadata;
}

export default function RecordDisplay({ record }: RecordDisplayProps) {
  return record ? (
    <div
      key={record.id}
      className="relative m-2 bg-gray-900 rounded-lg hover:shadow-xl hover:cursor-pointer border-gray-700 border-2 border-opacity-0 hover:border-opacity-100 hover:scale-105 aspect-video transition-all"
    >
      <div className="absolute w-full h-full left-0 top-0 z-0">
        <img src={`${BASE_URL}/thumbnail/${record.thumbnailId}`}></img>
      </div>
      <div className="absolute h-full w-full left-1 bottom-1 z-10 text-nowrap content-end">
        <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
          {record.name}
        </h5>
      </div>
    </div>
  ) : (
    <PlaceholderBox className="m-2 rounded-lg aspect-video" />
  );
}
