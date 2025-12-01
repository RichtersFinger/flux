import { useState } from "react";

import type { APIResponse } from "../../../../types";
import { pFetch } from "../../../../util/api";
import { useLocation, useRouter } from "../../../base/Router";
import Button from "../../../base/Button";
import TextInput from "../../../base/TextInput";
import MessageBox from "../../../base/MessageBox";
import Spinner from "../../../base/Spinner";

interface RegisterFormProps {
  onError?: () => void;
}

export default function RegisterForm({ onError }: RegisterFormProps) {
  const { search } = useLocation();
  const router = useRouter();

  // form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // workflow
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  function submitForm() {
    if (loading) return;
    setSuccess(false);
    setErrorMessage(undefined);
    setLoading(true);
    pFetch("/api/v0/user/register", {
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
          onError?.();
          setErrorMessage(json.meta.error?.long ?? "Unknown error");
          return;
        }
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setSuccess(true);
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
      {/* Register-Panel */}
      <h5 className="font-semibold text-lg">Create a new account</h5>
      <div className="flex flex-col space-y-2">
        <label htmlFor="usernameInput">Username</label>
        <TextInput
          id="usernameInput"
          className="text-gray-900 w-full"
          placeholder="username"
          value={username}
          onChange={(event) =>
            // remove forbidden characters
            setUsername(event.target.value.replace(/[^a-zA-Z0-9.@_-]/g, ""))
          }
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
        <label htmlFor="confirmPasswordInput">Confirm password</label>
        <TextInput
          id="confirmPasswordInput"
          type="password"
          className={`text-gray-900 w-full ${
            password !== confirmPassword ? "bg-red-200 border-red-600" : ""
          }`}
          placeholder="confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      {errorMessage ? (
        <MessageBox
          body={errorMessage}
          onDismiss={() => setErrorMessage(undefined)}
        />
      ) : null}
      {success ? (
        <MessageBox
          title="Success"
          body="Your account has been created!"
          color="green"
          onDismiss={() => setSuccess(false)}
        />
      ) : null}
      <Button
        disabled={
          loading ||
          username === "" ||
          password === "" ||
          password !== confirmPassword
        }
        onClick={submitForm}
      >
        {loading ? <Spinner size="xs" /> : "Submit"}
      </Button>
      <Button
        type="button"
        disabled={loading}
        onClick={() => {
          search?.delete("mode");
          router.navigate(undefined, search);
        }}
      >
        Back to login
      </Button>
    </form>
  );
}
