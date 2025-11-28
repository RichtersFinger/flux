import { useState } from "react";

import { useLocation, useRouter } from "../../../base/Router";
import Button from "../../../base/Button";
import Logo from "../../../base/Logo";
import TextInput from "../../../base/TextInput";
import MessageBox from "../../../base/MessageBox";

export default function LoginRegister() {
  const { search } = useLocation();
  const router = useRouter();

  const [error] = useState<string | undefined>(undefined);

  return (
    <div className="h-screen v-screen flex flex-row items-center justify-center relative">
      {/* Background */}
      <Logo className="absolute opacity-20 z-0" size="768" />
      <div className="z-10 w-72 rounded-xl bg-gray-500 shadow-2xl p-2 text-gray-200 select-none">
        {search?.get("mode") === "register" ? (
          <div className="flex flex-col space-y-4 ">
            {/* Register-Panel */}
            <h5 className="font-semibold text-lg">Register</h5>
            <div className="flex flex-col space-y-2">
              <label>Username</label>
              <TextInput
                className="text-gray-900 w-full"
                placeholder="username"
              />
              <label>Password</label>
              <TextInput
                type="password"
                className="text-gray-900 w-full"
                placeholder="password"
              />
              <label>Confirm password</label>
              <TextInput
                type="password"
                className="text-gray-900 w-full"
                placeholder="confirm password"
              />
            </div>
            <Button>Submit</Button>
            <Button
              onClick={() => {
                search?.delete("mode");
                router.navigate(undefined, search);
              }}
            >
              Back to login
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 ">
            {/* Login-Panel */}
            <h5 className="font-semibold text-lg">Login</h5>
            <div className="flex flex-col space-y-2">
              <label>Username</label>
              <TextInput
                className="text-gray-900 w-full"
                placeholder="username"
              />
              <label>Password</label>
              <TextInput
                type="password"
                className="text-gray-900 w-full"
                placeholder="password"
              />
            </div>
            {error ? <MessageBox body={error} /> : null}
            <Button>Submit</Button>
            <Button
              onClick={() => {
                const newSearch = new URLSearchParams(search);
                newSearch.set("mode", "register");
                router.navigate(undefined, newSearch);
              }}
            >
              Create new account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
