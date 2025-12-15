import { useLocation, useRouter } from "../../../../hooks/Router";
import { useTitle } from "../../../../hooks/Title";
import Navigate from "../../../base/Navigate";

export default function Watch() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const videoId = search?.get("id");
  useTitle(`flux | ${videoId ?? "Watch"}`);

  return (
    <div className="relative w-full h-full">
      <button
        className="bg-white"
        onClick={() =>
          navigate(
            undefined,
            new URLSearchParams({ id: new Date().getMilliseconds().toString() })
          )
        }
      >
        next
      </button>
      {videoId ? (
        <span className="absolute left-64 top-64 text-white">{videoId}</span>
      ) : (
        Navigate({ pathname: "/", search: "" })
      )}
    </div>
  );
}
