import { GmailLoginButton } from "./components/GmailLoginButton";
import { AppBanner } from "./components/AppBanner";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppBanner />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <GmailLoginButton />
      </main>
    </div>
  );
}
