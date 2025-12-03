import { useEffect } from "react";

/**
 * Sets document title.
 * @param title New document title.
 */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
