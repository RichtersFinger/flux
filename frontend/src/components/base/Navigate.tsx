import { useEffect } from "react";
import { useRouter } from "../../hooks/Router";

interface NavigateProps {
  pathname?: string;
  search?: string | URLSearchParams;
  useHistory?: boolean;
}

export default function Navigate({
  pathname,
  search,
  useHistory,
}: NavigateProps) {
  const router = useRouter();

  useEffect(() => {
    router.navigate(pathname, search, useHistory);
    // eslint-disable-next-line
  }, []);

  return null;
}
