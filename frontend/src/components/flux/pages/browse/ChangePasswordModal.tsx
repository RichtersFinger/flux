import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useRouter } from "../../../../hooks/Router";
import ConfirmModal from "../../../base/ConfirmModal";
import TextInput from "../../../base/TextInput";

export default function ChangePasswordModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    navigate(undefined, newSearch);
  }

  return (
    <ConfirmModal
      className="w-2xl max-h-11/12 overflow-y-auto show-dark-scrollbar"
      header={
        <div className="flex flex-row space-x-2 items-center">
          {search?.get("backm") ? (
            <div
              className="p-1 text-gray-100 hover:text-white hover:scale-105 hover:cursor-pointer rounded-full hover:bg-gray-700"
              onClick={() => {
                const newSearch = new URLSearchParams(search);
                newSearch.set("m", search.get("backm")!);
                newSearch.delete("backm");
                navigate(undefined, newSearch);
              }}
            >
              <FiArrowLeft size={24} />
            </div>
          ) : null}
          <h5 className="font-bold text-2xl"> Change password</h5>
        </div>
      }
      body={
        <div className="py-6 flex flex-col space-y-6 items-start ">
          <div className="flex flex-col space-y-2 ml-2">
            <label htmlFor="old-password">Old password</label>
            <TextInput
              id="old-password"
              className="text-gray-900"
              type="password"
            />
            <label htmlFor="new-password">New password</label>
            <TextInput
              id="new-password"
              className="text-gray-900"
              type="password"
            />
            <label htmlFor="repeat-new-password">Repeat new password</label>
            <TextInput
              id="repeat-new-password"
              className="text-gray-900"
              type="password"
            />
          </div>
        </div>
      }
      onCancel={close}
      onConfirm={() => {
        alert("Not yet implemented!");
      }}
      onDismiss={close}
    />
  );
}
