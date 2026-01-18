import { FiArrowLeft } from "react-icons/fi";
import { useLocation, useRouter } from "../../hooks/Router";
import ConfirmModal from "../base/ConfirmModal";
import TextInput from "../base/TextInput";
import { pFetch } from "../../util/api";
import { useState } from "react";
import MessageBox from "../base/MessageBox";
import type { APIResponse } from "../../types";

export default function ChangePasswordModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();

  // form inputs
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // workflow
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    newSearch.delete("mBack");
    navigate(undefined, newSearch);
  }

  return (
    <ConfirmModal
      header={
        <div className="flex flex-row space-x-2 items-center">
          {search?.get("mBack") ? (
            <div
              className="p-1 text-gray-100 hover:text-white hover:scale-105 hover:cursor-pointer rounded-full hover:bg-gray-700"
              onClick={() => {
                const newSearch = new URLSearchParams(search);
                newSearch.set("m", search.get("mBack")!);
                newSearch.delete("mBack");
                navigate(undefined, newSearch);
              }}
            >
              <FiArrowLeft size={24} />
            </div>
          ) : null}
          <h5 className="font-bold text-2xl">Change password</h5>
        </div>
      }
      body={
        <div className="py-6 flex flex-col space-y-6 items-start ">
          {errorMessage ? (
            <MessageBox
              body={errorMessage}
              onDismiss={() => setErrorMessage(undefined)}
            />
          ) : null}
          {successMessage ? (
            <MessageBox
              title="Success"
              color="green"
              body={successMessage}
              onDismiss={() => setSuccessMessage(undefined)}
            />
          ) : null}
          <div className="flex flex-col space-y-2 ml-2">
            <label htmlFor="old-password">Old password</label>
            <TextInput
              id="old-password"
              className="text-gray-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="new-password">New password</label>
            <TextInput
              id="new-password"
              className="text-gray-900"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label htmlFor="confirm-new-password">Confirm new password</label>
            <TextInput
              id="confirm-new-password"
              className="text-gray-900"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
        </div>
      }
      onCancel={close}
      confirmDisabled={
        password === "" || newPassword === "" || confirmNewPassword === ""
      }
      confirmLoading={loading}
      onConfirm={() => {
        if (newPassword !== confirmNewPassword) {
          setErrorMessage("New password does not match.");
          return;
        }

        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        pFetch("/api/v0/user/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: {
              currentPassword: password,
              newPassword: newPassword,
            },
          }),
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
            if (!json.meta.ok) {
              setErrorMessage(json.meta.error?.long ?? "Unknown error");
              return;
            }
            setSuccessMessage("Password successfully changed.");
            setPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
          })
          .catch((error) => {
            setLoading(false);
            setErrorMessage(error.message);
          });
      }}
      onDismiss={close}
    />
  );
}
