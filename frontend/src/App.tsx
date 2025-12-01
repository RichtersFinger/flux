import { useEffect, useState } from "react";

import type { APIResponse } from "./types";
import { pFetch } from "./util/api";
import { useLocation } from "./components/base/Router";
import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";

export default function App() {
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);

  // check for valid session
  useEffect(() => {
    pFetch("/api/v0/user/session")
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      }
      ).then((json: APIResponse) => {
        if (json.meta.ok) setLoggedIn(true);
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
