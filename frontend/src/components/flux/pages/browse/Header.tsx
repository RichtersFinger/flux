import { useState } from "react";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";

import { useSessionStore } from "../../../../store";
import Avatar from "../../../base/Avatar";
import ContextMenu from "../../../base/ContextMenu";
import Logo from "../../../base/Logo";

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);

  const { userConfiguration, logout } = useSessionStore();

  return (
    <div className="fixed px-1 w-full h-toolbar flex flex-row justify-between items-center z-50 bg-linear-to-r from-gray-800 via-gray-900 to-gray-900 shadow-2xl border-b border-gray-900">
      {/* logo */}
      <div className="mx-2">
        <Logo className="text-gray-100" src="/favicon.svg" text="flux" />
      </div>
      {/* tools */}
      <div>
        <input
          type="text"
          className="bg-gray-100 text-gray-900 rounded px-2 py-1"
          placeholder="Search ..."
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
