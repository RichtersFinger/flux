import { useState } from "react";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";

import { useLocation, useRouter } from "../../../../hooks/Router";
import { useSessionStore } from "../../../../store";
import Avatar from "../../../base/Avatar";
import ContextMenu from "../../../base/ContextMenu";
import Logo from "../../../base/Logo";
import TextSearch from "../../../base/TextSearch";

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const [filterAutoFocus, setFilterAutoFocus] = useState(false);

  const { navigate } = useRouter();
  const { search } = useLocation();
  const { userConfiguration, logout } = useSessionStore();

  return (
    <div className="fixed px-1 w-full h-toolbar flex flex-row justify-between items-center z-50 bg-linear-to-r from-gray-800 via-gray-900 to-gray-900 shadow-2xl border-b border-gray-900">
      {/* logo */}
      <div className="mx-2">
        <Logo className="text-gray-100" src="/favicon.svg" text="flux" />
      </div>
      {/* tools */}
      <div>
        <TextSearch
          key={search?.toString()}
          placeholder="Filter ..."
          autoFocus={filterAutoFocus}
          onFocus={() => setFilterAutoFocus(true)}
          initialValue={search?.get("search") ?? ""}
          onChange={(value) => {
            const newSearch = new URLSearchParams(search);
            if (value !== "") newSearch.set("search", value);
            else newSearch.delete("search");
            navigate(undefined, newSearch);
          }}
        />
      </div>
      {/* user */}
      <ContextMenu
        className="min-w-48"
        open={openMenu}
        title={
          <ContextMenu.BasicItem icon={<FiUser size={20} />}>
            {userConfiguration.user?.name}
          </ContextMenu.BasicItem>
        }
        items={[
          {
            id: "settings",
            content: (
              <ContextMenu.BasicItem icon={<FiSettings size={20} />}>
                Settings
              </ContextMenu.BasicItem>
            ),
            onClick: () => {
              setOpenMenu(false);
              navigate(
                undefined,
                new URLSearchParams({
                  ...Object.entries(search ?? []),
                  m: "settings",
                }),
              );
            },
          },
          {
            id: "logout",
            content: (
              <ContextMenu.BasicItem icon={<FiLogOut size={20} />}>
                Logout
              </ContextMenu.BasicItem>
            ),
            onClick: logout,
          },
        ]}
        onDismiss={() => setOpenMenu(false)}
      >
        <Avatar
          username={userConfiguration.user?.name}
          onClick={() => setOpenMenu((state) => !state)}
        />
      </ContextMenu>
    </div>
  );
}
