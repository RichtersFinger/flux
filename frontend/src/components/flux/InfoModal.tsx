import { useEffect, useState } from "react";
import { FiAlertCircle, FiGithub } from "react-icons/fi";
import { useToaster } from "../base/Toaster";
import { pFetch } from "../../util/api";
import Modal from "../base/Modal";
import Logo from "../base/Logo";
import Spinner from "../base/Spinner";
import Badge from "../base/Badge";
import Button from "../base/Button";
import { useLocation, useRouter } from "../../hooks/Router";

export default function InfoModal() {
  const { navigate } = useRouter();
  const { search } = useLocation();
  const { toast } = useToaster();

  const [version, setVersion] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  function close() {
    const newSearch = new URLSearchParams(search);
    newSearch.delete("m");
    navigate(undefined, newSearch);
  }

  useEffect(() => {
    setLoading(true);
    pFetch("/version")
      .then((response) => {
        setLoading(false);
        if (response.ok) response.text().then((text) => setVersion(text));
        else
          toast(
            "Failed to fetch software version.",
            <FiAlertCircle className="text-red-500" size={20} />,
          );
      })
      .catch((error) => {
        setLoading(false);
        toast(
          "Failed to fetch software version.",
          <FiAlertCircle className="text-red-500" size={20} />,
        );
        console.error(error);
      });
  }, [toast]);

  return (
    <Modal
      className="w-96"
      header={<h2 className="text-xl font-bold">Software Info</h2>}
      body={
        <div className="flex flex-col space-y-2">
          <Logo className="text-gray-100" src="/favicon.svg" text="flux" />
          <div className="flex flex-row space-x-2">
            <span>Software version: </span>
            {loading ? <Spinner size="xs" /> : <span>{version ?? "-"}</span>}
          </div>
          <div className="flex flex-row space-x-2">
            <a
              href="https://github.com/RichtersFinger/flux"
              target="_blank"
              rel="noreferrer"
            >
              <Badge className="px-4">
                <div className="flex flex-row space-x-2 items-center">
                  <FiGithub size={20} /> <span>View on GitHub</span>
                </div>
              </Badge>
            </a>
          </div>
          <span className="text-sm">Copyright (c) 2026 • MIT License</span>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <Button onClick={close}>Close</Button>
        </div>
      }
      onDismiss={close}
    />
  );
}
