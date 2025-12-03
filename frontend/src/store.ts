import type { APIResponse, SessionStore } from "./types";
import { formatAPIErrorMessage, pFetch } from "./util/api";
import { useToaster } from "./components/base/Toaster";
import { createShallowStore } from "./hooks/Store";

export const useSessionStore = createShallowStore<SessionStore>((get, set) => {
  const { toast } = useToaster();
  return {
    loggedIn: undefined,
    checkLogin: () => {
      pFetch("/api/v0/user/session")
        .then((response) => {
          if (!response.ok) {
            response.text().then((text) => console.error(text));
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((json: APIResponse) => {
          if (json.meta.ok) get().setLoggedIn(true);
          else {
            get().setLoggedIn(false);
            if (json.meta.error?.code !== 401)
              toast(formatAPIErrorMessage(json.meta));
          }
        })
        .catch((error) => {
          get().setLoggedIn(false);
          toast(
            formatAPIErrorMessage({
              error: {
                code: 0,
                short: "Connection error",
                long: error.message,
              },
            })
          );
          console.error(error);
        });
    },
    logout: () => {
      pFetch("/api/v0/user/session", { method: "DELETE" })
        .then((response) => {
          if (!response.ok) {
            response.text().then((text) => console.error(text));
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((json: APIResponse) => {
          if (json.meta.ok) get().setLoggedIn(false);
          else toast(formatAPIErrorMessage(json.meta));
        })
        .catch((error) => {
          toast(
            formatAPIErrorMessage({
              error: {
                code: 0,
                short: "Connection error",
                long: error.message,
              },
            })
          );
          console.error(error);
        });
    },
    setLoggedIn: (loggedIn) => {
      set({ loggedIn });
    },
    userConfiguration: {},
    setUserConfiguration: (userConfiguration) => {
      set((state) => ({
        userConfiguration: { ...state.userConfiguration, ...userConfiguration },
      }));
    },
  };
});
