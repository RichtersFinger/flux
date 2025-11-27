import { useLocation } from "./components/base/Router";
import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";
import LoginRegister from "./components/flux/pages/login_register/LoginRegister";

export default function App() {
  const location = useLocation();

  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-hidden">
      <Page>
        {{ "/browse": <Browse />, "/login": <LoginRegister /> }[location.pathname]}
      </Page>
    </div>
  );
}
