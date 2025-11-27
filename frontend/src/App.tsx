import Page from "./components/flux/Page";
import Browse from "./components/flux/pages/browse/Browse";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-800 overflow-x-clip overflow-y-auto">
      <Page>
        <Browse />
      </Page>
    </div>
  );
}
