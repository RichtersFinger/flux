import { useState } from "react";

import type { APIResponse } from "../../../../types";
import { pFetch } from "../../../../util/api";
import { useLocation, useRouter } from "../../../../hooks/Router";
import { useSessionStore } from "../../../../store";
import Button from "../../../base/Button";
import TextInput from "../../../base/TextInput";
import MessageBox from "../../../base/MessageBox";
import Spinner from "../../../base/Spinner";

interface LoginFormProps {
  onError?: () => void;
}

export default function LoginForm({ onError }: LoginFormProps) {
  const { search } = useLocation();
  const router = useRouter();
  const { checkLogin } = useSessionStore();

  // form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // workflow
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  function submitForm() {
    if (loading) return;
    setErrorMessage(undefined);
    setLoading(true);
    pFetch("/api/v0/user/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: { username, password } }),
    })
      .then((response) => {
        setLoading(false);
        if (!response.ok) {
          response.text().then((text) => console.error(text));
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json: APIResponse) => {
        if (!json.meta.ok) {
          setPassword("");
          onError?.();
          if (json.meta.error?.code === 401) {
            setErrorMessage("Incorrect username or password.");
          } else {
            setErrorMessage(json.meta.error?.long ?? "Unknown error");
          }
          return;
        }
        // redirect to browse-page
        checkLogin();
        router.navigate("/browse", new URLSearchParams());
      })
      .catch((error) => {
        setLoading(false);
        setErrorMessage(error.message);
        onError?.();
      });
  }

  return (
    <form
      className="flex flex-col space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submitForm();
      }}
    >
      {/* Login-Panel */}
      <h5 className="font-semibold text-lg">Login</h5>
      <div className="flex flex-col space-y-2">
        <label htmlFor="usernameInput">Username</label>
        <TextInput
          id="usernameInput"
          className="text-gray-900 w-full"
          placeholder="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="passwordInput">Password</label>
        <TextInput
          id="passwordInput"
          type="password"
          className="text-gray-900 w-full"
          placeholder="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {errorMessage ? (
        <MessageBox
          body={errorMessage}
          onDismiss={() => setErrorMessage(undefined)}
        />
      ) : null}
      <Button
        disabled={loading || username === "" || password === ""}
        onClick={submitForm}
      >
        {loading ? <Spinner size="xs" /> : "Submit"}
      </Button>
      <Button
        type="button"
        disabled={loading}
        onClick={() => {
          const newSearch = new URLSearchParams(search);
          newSearch.set("mode", "register");
          router.navigate(undefined, newSearch);
        }}
      >
        Create a new account
      </Button>
    </form>
  );
}
