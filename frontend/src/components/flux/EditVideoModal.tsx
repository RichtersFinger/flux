import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiClipboard, FiUpload, FiX } from "react-icons/fi";

import { useLocation, useRouter } from "../../hooks/Router";
import type { APIResponse, VideoInfo } from "../../types";
import { readImageFilesFromClipboard } from "../../util/clipboard";
import ConfirmModal from "../base/ConfirmModal";
import MessageBox from "../base/MessageBox";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../util/api";
import Spinner from "../base/Spinner";
import { useToaster } from "../base/Toaster";
import TextInput from "../base/TextInput";

export default function EditVideoModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();

  const [videoInfo, setVideoInfo] = useState<VideoInfo | undefined>(undefined);

  // form inputs
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // workflow
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  function fetchVideoInfo() {
    if (!search?.get("videoId")) return;

    pFetch(`/api/v0/index/video/${search.get("videoId")}`)
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<VideoInfo>) => {
        if (json.meta.ok && json.content) {
          setVideoInfo(json.content);
          setName(json.content.name);
          setDescription(json.content.description ?? "");
        } else setErrorMessage(formatAPIErrorMessage(json.meta));
      })
      .catch((error) => {
        setErrorMessage(
          formatAPIErrorMessage({
            error: {
              code: 0,
              short: "Connection error",
              long: error.message,
            },
          }),
        );
        console.error(error);
      });
  }

  // get video-info
  useEffect(() => {
    fetchVideoInfo();
    // eslint-disable-next-line
  }, [search?.get("videoId")]);

  // setup event handlers for drag&drop file-upload
  useEffect(() => {
    function handleDragOver(e: MouseEvent) {
      e.preventDefault();
    }
    window.addEventListener("dragover", handleDragOver, false);
    window.addEventListener("drop", handleDragOver, false);
    return () => {
      window.removeEventListener("dragover", handleDragOver, false);
      window.removeEventListener("drop", handleDragOver, false);
    };
  }, []);

  function loadThumbnail(files: FileList) {
    if (files.length === 0) return;
    if (!files[0]) return;
    if (!files[0].type.startsWith("image/")) {
      toast("Not an image!");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") setThumbnail(reader.result);
        setUploading(false);
      },
      false,
    );
    reader.addEventListener(
      "error",
      () => {
        setUploading(false);
        setErrorMessage(`Error loading file '${files[0].name}'.`);
      },
      false,
    );
    setUploading(true);
    reader.readAsDataURL(files[0]);
  }

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    newSearch.delete("mBack");
    newSearch.delete("recordId");
    newSearch.delete("seasonIndex");
    newSearch.delete("videoId");
    navigate(undefined, newSearch);
  }

  return (
    <ConfirmModal
      className="w-2xl max-h-11/12 overflow-y-auto show-dark-scrollbar"
      header={
        <div className="flex flex-row space-x-2 items-center">
          {search?.get("mBack") ? (
            <div
              className="p-1 text-gray-100 hover:text-white hover:scale-105 hover:cursor-pointer rounded-full hover:bg-gray-700"
              onClick={() => {
                const newSearch = new URLSearchParams(search);
                newSearch.set("m", search.get("mBack")!);
                newSearch.delete("mBack");
                newSearch.delete("videoId");
                navigate(undefined, newSearch);
              }}
            >
              <FiArrowLeft size={24} />
            </div>
          ) : null}
          <h5 className="font-bold text-2xl">
            {videoInfo ? `Edit video '${videoInfo.name}'` : "Edit video"}
          </h5>
        </div>
      }
      body={
        <div className="relative py-6 flex flex-col space-y-6 items-start ">
          <div className="absolute z-10 top-5 left-1/2 -translate-x-1/2 w-full">
            {errorMessage ? (
              <MessageBox
                className="w-full"
                body={errorMessage}
                onDismiss={() => setErrorMessage(undefined)}
              />
            ) : null}
            {successMessage ? (
              <MessageBox
                className="w-full"
                title="Success"
                color="green"
                body={successMessage}
                onDismiss={() => setSuccessMessage(undefined)}
              />
            ) : null}
          </div>
          {videoInfo ? (
            <div className="flex flex-col space-y-5">
              <div className="w-full">
                <div className="w-full flex flex-row space-x-2 items-start mx-4 my-2 select-none">
                  <div
                    className="group relative w-64 rounded-xl border-gray-700 border-2 aspect-video overflow-clip hover:cursor-pointer"
                    onClick={() => {
                      if (!uploading) fileUploadRef.current?.click();
                      else toast("A file is already being uploaded!");
                    }}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    onDragEnter={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDraggingFile(true);
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDraggingFile(false);
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDraggingFile(false);
                      if (!uploading) loadThumbnail(e.dataTransfer.files);
                      else toast("A file is already being uploaded!");
                    }}
                  >
                    <img
                      className={`absolute left-1/2 top-1/2 -translate-1/2 transition-all ${uploading || hovering || draggingFile ? "blur-xs" : ""}`}
                      src={
                        thumbnail ??
                        `${BASE_URL}/thumbnail/${videoInfo.thumbnailId}`
                      }
                    />
                    <div
                      className={`flex flex-row space-x-2 absolute left-1 top-1 py-1 px-2 opacity-0 group-hover:opacity-80 rounded-full bg-[rgba(0,0,0,0.5)] text-gray-400 hover:text-gray-100 transition-all`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        readImageFilesFromClipboard(loadThumbnail);
                      }}
                    >
                      <span>Insert from </span>
                      <FiClipboard size={20} />
                    </div>
                    <div
                      className={`absolute right-1 top-1 p-1 opacity-0 ${thumbnail ? "group-hover:opacity-80" : ""} rounded-full bg-[rgba(0,0,0,0.5)] text-gray-400 hover:text-gray-100 transition-all`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setThumbnail(undefined);
                      }}
                    >
                      <FiX size={20} />
                    </div>
                    <div
                      className={`absolute left-1/2 top-1/2 -translate-1/2 h-12 p-5 rounded-full bg-gray-800 text-gray-200 text-sm transition-opacity ${hovering && !uploading && !draggingFile ? "opacity-80" : "opacity-0"} flex flex-row items-center space-x-2 pointer-events-none`}
                    >
                      <FiUpload size={25} />
                      <span className="text-nowrap">Upload thumbnail ...</span>
                    </div>
                    <div
                      className={`absolute left-1/2 top-1/2 -translate-1/2 h-12 p-5 rounded-full bg-gray-800 text-gray-200 text-sm transition-opacity ${draggingFile && !uploading ? "opacity-80" : "opacity-0"} flex flex-row items-center space-x-2 pointer-events-none`}
                    >
                      <FiUpload size={25} />
                      <span className="text-nowrap">Drop to upload ...</span>
                    </div>
                    <div
                      className={`absolute left-1/2 top-1/2 -translate-1/2 h-12 p-5 rounded-full bg-gray-800 text-gray-200 text-sm transition-opacity ${uploading ? "opacity-80" : "opacity-0"} flex flex-row items-center space-x-2 pointer-events-none`}
                    >
                      <Spinner size="xs" />
                      <span className="text-nowrap">Uploading ...</span>
                    </div>
                    <input
                      ref={fileUploadRef}
                      className="hidden"
                      type="file"
                      onChange={(e) => {
                        if (e.target.files) loadThumbnail(e.target.files);
                      }}
                    />
                  </div>
                  <div className="w-80 text-gray-800 flex flex-col space-y-1">
                    <TextInput
                      className="w-full bg-gray-200"
                      maxLength={256}
                      value={name}
                      placeholder="Record title"
                      onChange={(e) => setName(e.target.value)}
                    />
                    <textarea
                      className="p-1 px-2 h-26 border bg-gray-200 rounded resize-none text-sm"
                      maxLength={2048}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      }
      onCancel={close}
      confirmLoading={loading}
      confirmDisabled={
        videoInfo === undefined ||
        (thumbnail === undefined &&
          name === videoInfo?.name &&
          description === videoInfo?.description)
      }
      onConfirm={() => {
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setLoading(true);

        pFetch(`/api/v0/index/video/${videoInfo?.id}`, {
          method: "PUT",
          body: JSON.stringify({ content: { name, description, thumbnail } }),
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => {
            setLoading(false);
            if (!response.ok) {
              response.text().then((text) => console.error(text));
              throw new Error(response.statusText);
            }
            return response.json();
          })
          .then((json: APIResponse) => {
            if (json.meta.ok) {
              if (search?.get("mBack")) {
                const newSearch = new URLSearchParams(search);
                newSearch.set("m", search.get("mBack")!);
                newSearch.delete("mBack");
                newSearch.delete("videoId");
                navigate(undefined, newSearch);
              } else {
                fetchVideoInfo();
                setThumbnail(undefined);
                setSuccessMessage("Changes successfully applied.");
              }
            } else {
              setErrorMessage(formatAPIErrorMessage(json.meta));
            }
          })
          .catch((error) => {
            setLoading(false);
            setErrorMessage(
              formatAPIErrorMessage({
                error: {
                  code: 0,
                  short: "Connection error",
                  long: error.message,
                },
              }),
            );
            console.error(error);
          });
      }}
      onDismiss={close}
    />
  );
}
