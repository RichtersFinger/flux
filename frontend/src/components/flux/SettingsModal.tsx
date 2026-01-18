import { useState } from "react";
import { useLocation, useRouter } from "../../hooks/Router";
import { useSessionStore } from "../../store";
import Avatar from "../base/Avatar";
import ConfirmModal from "../base/ConfirmModal";
import RangeInput from "../base/RangeInput";
import Button from "../base/Button";
import MessageBox from "../base/MessageBox";

export default function SettingsModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { userConfiguration, putUserConfiguration } = useSessionStore();

  // form inputs
  const [volume, setVolume] = useState<number | undefined>(undefined);
  const [muted, setMuted] = useState<boolean | undefined>(undefined);
  const [autoplay, setAutoplay] = useState<boolean | undefined>(undefined);

  // workflow
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  if (userConfiguration.settings?.volume !== undefined && volume === undefined)
    setVolume(userConfiguration.settings.volume);
  if (userConfiguration.settings?.muted !== undefined && muted === undefined)
    setMuted(userConfiguration.settings.muted);
  if (
    userConfiguration.settings?.autoplay !== undefined &&
    autoplay === undefined
  )
    setAutoplay(userConfiguration.settings.autoplay);

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    navigate(undefined, newSearch);
  }

  return (
    <ConfirmModal
      className="w-2xl max-h-11/12 overflow-y-auto show-dark-scrollbar"
      header={<h5 className="font-bold text-2xl">{`Settings`}</h5>}
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
          <div className="flex flex-col space-y-2">
            <h5 className="text-gray-100 font-semibold text-xl">Account</h5>
            <div className="w-full flex flex-row items-start m-4 space-x-6">
              <div className="p-6">
                <Avatar
                  className="scale-200"
                  username={userConfiguration.user?.name}
                />
              </div>
              <div className="min-w-64 max-w-72">
                <h5 className="text-gray-100 font-semibold text-xl truncate">
                  {userConfiguration.user?.name}
                </h5>
                <p className="text-gray-500">
                  role:{" "}
                  {userConfiguration.user?.isAdmin
                    ? "administrator"
                    : "regular user"}
                </p>
              </div>
              <Button
                onClick={() =>
                  navigate(
                    undefined,
                    new URLSearchParams({
                      ...Object.entries(search ?? []),
                      m: "change-password",
                      mBack: "settings",
                    }),
                  )
                }
              >
                Change Password
              </Button>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <h5 className="text-gray-100 font-semibold text-xl">Playback</h5>
            <div className="grid grid-cols-[auto_200px] gap-x-4 gap-y-6 place-items-baseline">
              <label>Volume</label>
              <div className="-translate-y-1/2 w-full">
                <RangeInput value={volume} onChange={setVolume} />
              </div>
              <label>Muted</label>
              <div className="translate-y-1/8">
                <input
                  className="size-5 hover:cursor-pointer"
                  type="checkbox"
                  checked={muted ?? false}
                  onChange={(e) => setMuted(e.target.checked)}
                />
              </div>
              <label>Autoplay</label>
              <div className="translate-y-1/8">
                <input
                  className="size-5 hover:cursor-pointer"
                  type="checkbox"
                  checked={autoplay ?? false}
                  onChange={(e) => setAutoplay(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      }
      onCancel={close}
      confirmLoading={loading}
      confirmDisabled={
        volume === userConfiguration.settings?.volume &&
        muted === userConfiguration.settings?.muted &&
        autoplay === userConfiguration.settings?.autoplay
      }
      onConfirm={() => {
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setLoading(true);
        putUserConfiguration(
          { volume, muted, autoplay },
          {
            onSuccess: () => {
              setLoading(false);
              setSuccessMessage("Configuration successfully updated.");
            },
            onFail: (message) => {
              setLoading(false);
              setErrorMessage(message);
            },
          },
        );
      }}
      onDismiss={close}
    />
  );
}
