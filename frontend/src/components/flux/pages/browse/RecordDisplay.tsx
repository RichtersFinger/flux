import { useRouter } from "../../../../hooks/Router";
import type { APIResponse, RecordMetadata, VideoInfo } from "../../../../types";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../../../util/api";
import { useToaster } from "../../../base/Toaster";
import PlaceholderBox from "../../../base/PlaceholderBox";

interface RecordDisplayProps {
  record?: RecordMetadata;
  options?: {
    id: string;
    node: React.ReactNode;
    getOnClick: (
      record: RecordMetadata
    ) => React.MouseEventHandler<HTMLDivElement>;
  }[];
}

export default function RecordDisplay({ record, options }: RecordDisplayProps) {
  const { navigate } = useRouter();
  const { toast } = useToaster();

  return record ? (
    <div
      key={record.id}
      className="relative m-2 bg-gray-900 rounded-lg hover:shadow-xl hover:cursor-pointer border-gray-700 border-2 border-opacity-0 hover:border-opacity-100 hover:scale-105 aspect-video transition-all overflow-clip"
      onClick={() => {
        pFetch(`/api/v0/index/record/${record.id}/current-video`)
          .then((response) => {
            if (!response.ok) {
              response.text().then((text) => console.error(text));
              throw new Error(response.statusText);
            }
            return response.json();
          })
          .then(
            (
              json: APIResponse<{
                video: VideoInfo;
                playback?: { timestamp?: number };
              }>
            ) => {
              if (json.meta.ok && json.content)
                navigate(
                  "/watch",
                  new URLSearchParams({
                    id: json.content.video.id,
                    t: (json.content.playback?.timestamp ?? 0).toString(),
                  })
                );
              else toast(formatAPIErrorMessage(json.meta));
            }
          )
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
      }}
    >
      <div className="absolute w-full left-1/2 top-1/2 -translate-1/2 z-0">
        <img src={`${BASE_URL}/thumbnail/${record.thumbnailId}`}></img>
      </div>
      <div className="absolute h-full w-full left-1 bottom-1 z-20 text-nowrap content-end">
        <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
          {record.name}
        </h5>
      </div>
      <div className="absolute w-full h-full left-0 top-0 z-20 bg-[rgba(0,0,0,0.7)] transition-opacity opacity-0 hover:opacity-100">
        <div className="absolute h-full w-full left-1 top-1 content-start">
          <p className="m-2 mr-10 text-gray-500 text-lg line-clamp-4">
            {record.description}
          </p>
        </div>
        <div className="absolute h-full w-full left-1 bottom-1 text-nowrap content-end">
          <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
            {record.name}
          </h5>
        </div>
        <div className="absolute right-2 top-2 h-full w-6 flex flex-col space-y-3 items-center justify-start text-gray-100">
          {options?.map((item) => (
            <div
              key={item.id}
              className="opacity-70 hover:opacity-100 hover:scale-125 transition-all"
              onClick={item.getOnClick(record)}
            >
              {item.node}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <PlaceholderBox className="m-2 rounded-lg aspect-video" />
  );
}
