import { useSyncExternalStore } from "react";

// types
interface LocationStore {
  pathname: string;
  search?: URLSearchParams;
  subscribers: Set<() => void>;
  getPathname: () => string;
  getSearch: () => URLSearchParams | undefined;
  subscribe: (callback: () => void) => () => void;
  navigate: (
    pathname?: string,
    search?: string | URLSearchParams,
    useHistory?: boolean
  ) => void;
}

// custom store implementation
const locationStore: LocationStore = {
  pathname: window.location.pathname,
  search: new URLSearchParams(window.location.search),
  subscribers: new Set(),
  getPathname() {
    return locationStore.pathname;
  },
  getSearch() {
    return locationStore.search;
  },
  subscribe(callback) {
    locationStore.subscribers.add(callback);
    return () => locationStore.subscribers.delete(callback);
  },
  navigate(pathname, search, useHistory = true) {
    // update store
    if (pathname !== undefined) locationStore.pathname = pathname;
    if (search !== undefined) {
      locationStore.search = new URLSearchParams(search);
    }

    // update location
    if (useHistory) {
      const query = locationStore.search?.toString() ?? "";
      window.history.pushState(
        {},
        "flux" + locationStore.pathname,
        locationStore.pathname + (query === "" ? "" : `?${query}`)
      );
    }

    // notify subscribers
    locationStore.subscribers.forEach((callback) => callback());
  },
};

// handle onpopstate-events
window.addEventListener("popstate", () =>
  locationStore.navigate(
    window.location.pathname,
    window.location.search,
    false
  )
);

/**
 * Router-hook that provides navigation
 * @prop "navigate" navigate to new location
 */
export function useRouter() {
  return {
    navigate: locationStore.navigate,
  };
}

/**
 * Location-hook that returns current location.
 * @prop "pathname" current path
 * @prop "search" current url query
 */
export function useLocation() {
  const pathname = useSyncExternalStore(
    locationStore.subscribe,
    locationStore.getPathname
  );
  const search = useSyncExternalStore(
    locationStore.subscribe,
    locationStore.getSearch
  );
  return { pathname, search };
}
