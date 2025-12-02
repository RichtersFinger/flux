import { useEffect } from "react";

import { useSessionStore } from "./store";
import { useLocation } from "./components/base/Router";
import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";

export default function App() {
  const location = useLocation();
  const { loggedIn, checkLogin } = useSessionStore();

  // check for valid session
  useEffect(() => checkLogin(), [checkLogin]);

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
