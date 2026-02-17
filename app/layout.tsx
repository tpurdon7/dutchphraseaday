import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { AmsterdamBackground } from "@/components/AmsterdamBackground";
import { getRegisteredUserCount } from "@/lib/clerk-stats";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dutch Sentence a Day",
  description: "Learn 100 practical Dutch sentences in 100 days."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = Boolean(clerkPublishableKey && process.env.CLERK_SECRET_KEY);
  const registeredUserCount = hasClerk ? await getRegisteredUserCount() : null;
  const content = (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-6 pt-5 sm:px-6">
      <header className="mb-6 flex items-center justify-between rounded-3xl border border-stroke/80 bg-card/90 px-4 py-3 shadow-soft backdrop-blur">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ink">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-10 flex-col overflow-hidden rounded-sm border border-slate-300/70 shadow-sm"
          >
            <span className="h-1/3 w-full bg-[#ae1c28]" />
            <span className="h-1/3 w-full bg-white" />
            <span className="h-1/3 w-full bg-[#21468b]" />
          </span>
          <span className="leading-none">the flying dutchman</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm text-muted">
            <Link href="/history" className="transition hover:text-accent">
              History
            </Link>
            <Link href="/settings" className="transition hover:text-accent">
              Settings
            </Link>
          </nav>
          {hasClerk ? (
            <div className="flex items-center gap-2 text-sm">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-xl border border-stroke bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-50"
                  >
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-800"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          ) : null}
        </div>
      </header>
      {typeof registeredUserCount === "number" ? (
        <div className="mb-4 flex">
          <span className="rounded-full border border-stroke bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {registeredUserCount.toLocaleString()} accounts
          </span>
        </div>
      ) : null}
      <main className="animate-rise">{children}</main>
    </div>
  );

  return (
    <html lang="en">
      <body className="bg-canvas font-[var(--font-manrope)] text-ink antialiased">
        <AmsterdamBackground />
        {hasClerk ? <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
