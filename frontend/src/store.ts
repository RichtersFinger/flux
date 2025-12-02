import { createShallowStore } from "./hooks/Store";
import type { APIResponse, SessionStore } from "./types";
import { pFetch } from "./util/api";

export const useSessionStore = createShallowStore<SessionStore>((get, set) => ({
  loggedIn: false,
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
        else get().setLoggedIn(false);
      })
      .catch((error) => {
        get().setLoggedIn(false);
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
}));
