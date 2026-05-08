"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("admin", { password, redirect: false });

      if (!result) {
        setError("Something went wrong. Please try again.");
        return;
      }

      if (result.error) {
        if (result.error.includes("429") || result.error.toLowerCase().includes("too many")) {
          setError("Too many attempts — try again in a minute");
        } else {
          setError("Incorrect password");
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) {
        setError("Too many attempts — try again in a minute");
      } else {
        setError("Incorrect password");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2" aria-hidden="true">🔐</div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-foreground)]">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-[var(--color-foreground)]/60 font-[family-name:var(--font-body)]">
            Days Out — parent access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white text-[var(--color-foreground)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-[var(--color-error)]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || isLoading}
            className="w-full min-h-[52px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-40"
          >
            {isLoading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
