import { useEffect } from "react";

import { pFetch } from "./util/api";
import type { APIResponse, UserConfiguration } from "./types";
import { useSessionStore } from "./store";
import { useLocation } from "./hooks/Router";
import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";

export default function App() {
  const location = useLocation();
  const { loggedIn, checkLogin, userConfiguration, setUserConfiguration } =
    useSessionStore();

  // check for valid session
  useEffect(() => checkLogin(), [checkLogin]);

  // load user-configuration on valid login
  useEffect(() => {
    if (!loggedIn) return;
    pFetch("/api/v0/user/configuration")
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse<UserConfiguration>) => {
        if (json.meta.ok && json.content)
          setUserConfiguration(json.content);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [loggedIn]);

  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-hidden">
      <Page>
        {
          { "/browse": <Browse />, "/login": <LoginRegister /> }[
            location.pathname
          ]
        }
      </Page>
      <span className="text-gray-300">{userConfiguration.user?.name}</span>
      <div
        className={`w-3 aspect-square rounded-full ${
          loggedIn ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </div>
  );
}
