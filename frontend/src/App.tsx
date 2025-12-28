import { useEffect } from "react";

import { useLocation, useRouter } from "./hooks/Router";
import Toaster, { useToaster } from "./components/base/Toaster";
import { useSessionStore } from "./store";
import Page from "./components/flux/Page";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";
import Browse from "./components/flux/pages/browse/Browse";
import Watch from "./components/flux/pages/watch/Watch";
import Navigate from "./components/base/Navigate";

export default function App() {
  const location = useLocation();
  const router = useRouter();
  const { toast } = useToaster();
  const { loggedIn, checkLogin, fetchUserConfiguration } = useSessionStore();

  // reset potentially hidden cursor
  useEffect(() => {
    document.body.style.cursor = "";
  }, [location.pathname]);

  // check for valid session
  useEffect(() => checkLogin(), [checkLogin]);

  // redirect to login if not already logged in
  useEffect(() => {
    if (loggedIn === undefined || loggedIn === true) return;
    if (location.pathname !== "/login") router.navigate("/login", "");
    // eslint-disable-next-line
  }, [loggedIn]);

  // load user-configuration on valid login
  useEffect(() => {
    if (!loggedIn) return;
    fetchUserConfiguration();
  }, [loggedIn, fetchUserConfiguration, toast]);

  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-hidden">
      <Toaster />
      {loggedIn !== undefined && (
        <Page>
          {{
            "/browse": <Browse />,
            "/watch": <Watch key={location.search?.get("id")} />,
            "/login": loggedIn ? (
              <Navigate pathname="/browse" search="" />
            ) : (
              <LoginRegister />
            ),
          }[location.pathname] ??
            (loggedIn ? <Navigate pathname="/browse" search="" /> : null)}
        </Page>
      )}
    </div>
  );
}
