import { useEffect, useState } from "react";

import { useLocation } from "./components/base/Router";
import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";

export const BASE_URL = import.meta.env.VITE_DEV_API_BASE_URL ?? "";
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: import.meta.env.VITE_DEV_API_BASE_URL ? "include" : "same-origin",
};
/**
 * Patched global.fetch which pre-applies the base-url and options
 */
export function pFetch (input: RequestInfo | URL, init?: RequestInit | undefined) {
  return fetch(`${BASE_URL}${input}`, {
    ...DEFAULT_FETCH_OPTIONS,
    ...init,
  });
};

export default function App() {
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);

  // check for valid session
  useEffect(() => {
    pFetch("/api/v0/user/session")
      .then((response) => {
        if (response.status === 200) setLoggedIn(true);
        else setLoggedIn(false);
      })
      .catch((error) => {
        setLoggedIn(false);
        console.error(error);
      });
  }, [setLoggedIn]);

  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-hidden">
      <Page>
        {
          { "/browse": <Browse />, "/login": <LoginRegister /> }[
            location.pathname
          ]
        }
      </Page>
      <div
        className={`w-3 aspect-square rounded-full ${
          loggedIn ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </div>
  );
}
