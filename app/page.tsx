import { GmailSignInButton } from "./pages/GmailSignInButton";

export default function Home() {
  return (
    <>
      <header className="border-b border-foreground px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Sign in via <GmailSignInButton /></h1>
      </header>
      <div className="px-6 pt-6 text-center">
      </div>
    </>
  );
}
