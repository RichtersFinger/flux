import PlaceholderBox from "../../../base/PlaceholderBox";

interface ContentMetadata {
  name: string;
}

interface ContentItem {
  id: string;
  meta: ContentMetadata;
}

interface ContentProps {
  title: string;
  content?: ContentItem[];
}

export default function Content({ title, content }: ContentProps) {
  if (content?.length === 0) return null;

  return (
    <div className="select-none">
      <h5 className="text-3xl font-bold text-gray-100">{title}</h5>
      <div className="grid grid-flow-row sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-2">
        {content ? (
          content.map((item) => (
            <div
              key={item.id}
              className="m-2 bg-gray-900 rounded-lg hover:shadow-xl hover:cursor-pointer border-gray-700 border-2 border-opacity-0 hover:border-opacity-100 hover:scale-105 aspect-video transition-all"
            >
              <div className="h-full w-full text-nowrap content-end">
                <h5 className="m-2 text-gray-100 font-semibold text-xl truncate">
                  {item.meta.name}
                </h5>
              </div>
            </div>
          ))
        ) : (
          <PlaceholderBox className="m-2 rounded-lg aspect-video" />
        )}
      </div>
    </div>
  );
}
