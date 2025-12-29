import { useSyncExternalStore } from "react";

// types
interface LocationStore {
  pathname: string;
  search?: URLSearchParams;
  subscribers: { pathname: Set<() => void>; search: Set<() => void> };
  getPathname: () => string;
  getSearch: () => URLSearchParams | undefined;
  subscribePathname: (callback: () => void) => () => void;
  subscribeSearch: (callback: () => void) => () => void;
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
  subscribers: { pathname: new Set(), search: new Set() },
  getPathname() {
    return locationStore.pathname;
  },
  getSearch() {
    return locationStore.search;
  },
  subscribePathname(callback) {
    locationStore.subscribers.pathname.add(callback);
    return () => locationStore.subscribers.pathname.delete(callback);
  },
  subscribeSearch(callback) {
    locationStore.subscribers.search.add(callback);
    return () => locationStore.subscribers.search.delete(callback);
  },
  navigate(pathname, search, useHistory = true) {
    // update store
    if (pathname !== undefined) locationStore.pathname = pathname;
    if (search !== undefined)
      locationStore.search = new URLSearchParams(search);

    // update location
    const query = locationStore.search?.toString() ?? "";
    if (useHistory)
      window.history.pushState(
        null,
        "",
        locationStore.pathname + (query === "" ? "" : `?${query}`)
      );
    else
      window.history.replaceState(
        null,
        "",
        locationStore.pathname + (query === "" ? "" : `?${query}`)
      );

    // notify subscribers
    if (pathname !== undefined)
      locationStore.subscribers.pathname.forEach((callback) => callback());
    if (search !== undefined)
      locationStore.subscribers.search.forEach((callback) => callback());
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
    locationStore.subscribePathname,
    locationStore.getPathname
  );
  const search = useSyncExternalStore(
    locationStore.subscribeSearch,
    locationStore.getSearch
  );
  return { pathname, search };
}
