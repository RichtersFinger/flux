import { useRouter } from "../../../../hooks/Router";
import type { RecordMetadata } from "../../../../types";
import { BASE_URL } from "../../../../util/api";
import PlaceholderBox from "../../../base/PlaceholderBox";

interface RecordDisplayProps {
  record?: RecordMetadata;
}

export default function RecordDisplay({ record }: RecordDisplayProps) {
  const { navigate } = useRouter();
  return record ? (
    <div
      key={record.id}
      className="relative m-2 bg-gray-900 rounded-lg hover:shadow-xl hover:cursor-pointer border-gray-700 border-2 border-opacity-0 hover:border-opacity-100 hover:scale-105 aspect-video transition-all overflow-clip"
      onClick={() => {
        // TODO: wrap this into a fetch for videoId
        navigate("/watch", new URLSearchParams({ id: record.id }))}
      }
    >
      <div className="absolute w-full h-full left-0 top-0 z-0">
        <img src={`${BASE_URL}/thumbnail/${record.thumbnailId}`}></img>
      </div>
      <div className="absolute h-full w-full left-1 bottom-1 z-20 text-nowrap content-end">
        <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
          {record.name}
        </h5>
      </div>
      <div className="absolute w-full h-full left-0 top-0 z-20 bg-black transition-opacity opacity-0 hover:opacity-70">
        <div className="absolute h-full w-full left-1 top-1 content-start">
          <p className="m-2 text-gray-100 text-lg line-clamp-4">
            {record.description}
          </p>
        </div>
        <div className="absolute h-full w-full left-1 bottom-1 text-nowrap content-end">
          <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
            {record.name}
          </h5>
        </div>
      </div>
    </div>
  ) : (
    <PlaceholderBox className="m-2 rounded-lg aspect-video" />
  );
}
