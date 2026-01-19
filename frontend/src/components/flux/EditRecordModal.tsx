import { useEffect, useRef, useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

import { useLocation, useRouter } from "../../hooks/Router";
import type { RecordMetadata, APIResponse, RecordInfo } from "../../types";
import ConfirmModal from "../base/ConfirmModal";
import MessageBox from "../base/MessageBox";
import { BASE_URL, formatAPIErrorMessage, pFetch } from "../../util/api";
import Spinner from "../base/Spinner";
import { useToaster } from "../base/Toaster";
import TextInput from "../base/TextInput";

export default function EditRecordModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();

  const [recordInfo, setRecordInfo] = useState<RecordMetadata | undefined>(
    undefined,
  );

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

  function fetchRecordInfo() {
    if (!search?.get("recordId")) return;

    pFetch(`/api/v0/index/record/${search.get("recordId")}`)
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<RecordInfo>) => {
        if (json.meta.ok && json.content) {
          setRecordInfo(json.content);
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

  // get record-info
  useEffect(() => {
    fetchRecordInfo();
    // eslint-disable-next-line
  }, [search?.get("recordId")]);

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
      alert("Not an image!");
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
    newSearch.delete("recordId");
    navigate(undefined, newSearch);
  }

  return (
    <ConfirmModal
      className="w-2xl max-h-11/12 overflow-y-auto show-dark-scrollbar"
      header={
        <h5 className="font-bold text-2xl">
          {recordInfo ? `Edit record '${recordInfo.name}'` : "Edit record"}
        </h5>
      }
      body={
        <div className="py-6 flex flex-col space-y-6 items-start ">
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
          {recordInfo ? (
            <div className="flex flex-col space-y-5">
              <div className="w-full">
                <h5 className="text-gray-100 font-semibold text-xl">Record</h5>
                <div className="w-full flex flex-row space-x-2 items-start mx-4 my-2 select-none">
                  <div
                    className="group relative w-64 rounded-xl border-gray-700 border-2 aspect-video overflow-clip hover:cursor-pointer"
                    onClick={() => fileUploadRef.current?.click()}
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
                        `${BASE_URL}/thumbnail/${recordInfo.thumbnailId}`
                      }
                    />
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
                    <input ref={fileUploadRef} className="hidden" type="file" />
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
              <div className="flex flex-col space-y-5">
                <h5 className="text-gray-100 font-semibold text-xl">Content</h5>
                <div className="w-full mx-4 my-2 text-gray-500">
                  Not yet implemented.
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
        recordInfo === undefined ||
        (thumbnail === undefined &&
          name === recordInfo?.name &&
          description === recordInfo?.description)
      }
      onConfirm={() => {
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setLoading(true);

        pFetch(`/api/v0/index/record/${recordInfo?.id}`, {
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
              fetchRecordInfo();
              setThumbnail(undefined);
              setSuccessMessage("Changes successfully applied.");
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
