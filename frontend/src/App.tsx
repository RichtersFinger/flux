import Logo from "./components/Logo";

export default function App() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-800">
      <Logo className="text-gray-300" src="/favicon.svg" text="flux" />
    </div>
  );
}
