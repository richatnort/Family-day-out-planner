"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function PinPage() {
  return (
    <Suspense>
      <PinPageInner />
    </Suspense>
  );
}

function PinPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");

  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const MAX_PIN_LENGTH = 6;

  async function handleSubmit(currentPin: string) {
    if (isLocked || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("pin", {
        pin: currentPin,
        redirect: false,
      });

      if (!result) {
        setError("Something went wrong. Please try again.");
        setPin("");
        return;
      }

      if (result.error) {
        if (result.error === "CredentialsSignin") {
          setError("Oops! Try again");
          setPin("");
        } else if (result.error.includes("429") || result.error.toLowerCase().includes("too many")) {
          setError("Too many tries! Take a break and try again in a minute");
          setIsLocked(true);
          setPin("");
        } else {
          setError("Oops! Try again");
          setPin("");
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("429")) {
        setError("Too many tries! Take a break and try again in a minute");
        setIsLocked(true);
      } else {
        setError("Oops! Try again");
      }
      setPin("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDigit(digit: string) {
    if (isLocked || isLoading) return;
    if (pin.length >= MAX_PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);
    if (newPin.length === MAX_PIN_LENGTH) {
      handleSubmit(newPin);
    }
  }

  function handleBackspace() {
    if (isLocked || isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "Backspace") handleBackspace();
      if (e.key === "Enter" && pin.length > 0) handleSubmit(pin);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const numpadDigits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 py-12">
      {/* Logo / title area */}
      <div className="text-center">
        <div className="text-5xl mb-2" aria-hidden="true">🌞</div>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-foreground)]">
          Days Out
        </h1>
        <p className="mt-2 text-sm text-[var(--color-foreground)]/60 font-[family-name:var(--font-body)]">
          Enter your family PIN
        </p>
        {errorParam && (
          <p className="mt-1 text-sm font-medium text-[var(--color-accent)] font-[family-name:var(--font-body)]">
            Your session ended — enter your PIN to continue
          </p>
        )}
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-3 mt-8" role="status" aria-label={`${pin.length} digits entered`}>
        {Array.from({ length: MAX_PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`text-2xl transition-all duration-150 ${
              i < pin.length
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-border)]"
            }`}
          >
            {i < pin.length ? "●" : "○"}
          </span>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm font-medium text-[var(--color-error)] text-center" role="alert">
          {error}
        </p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-4 mt-8 max-w-xs mx-auto w-full" aria-label="PIN numpad">
        {numpadDigits.map((row) =>
          row.map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={isLocked || isLoading}
              className="min-w-[72px] min-h-[72px] rounded-full bg-white shadow-[var(--shadow-sm)] text-2xl font-semibold text-[var(--color-foreground)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 hover:shadow-[var(--shadow-md)] mx-auto w-full"
              aria-label={`Digit ${digit}`}
            >
              {digit}
            </button>
          ))
        )}

        {/* Bottom row: empty + 0 + backspace */}
        <div className="min-w-[72px] min-h-[72px]" aria-hidden="true" />

        <button
          onClick={() => handleDigit("0")}
          disabled={isLocked || isLoading}
          className="min-w-[72px] min-h-[72px] rounded-full bg-white shadow-[var(--shadow-sm)] text-2xl font-semibold text-[var(--color-foreground)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 hover:shadow-[var(--shadow-md)] mx-auto w-full"
          aria-label="Digit 0"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          disabled={isLocked || isLoading || pin.length === 0}
          className="min-w-[72px] min-h-[72px] rounded-full bg-white shadow-[var(--shadow-sm)] text-2xl font-semibold text-[var(--color-foreground)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 hover:shadow-[var(--shadow-md)] mx-auto w-full"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>

      {/* Enter button for shorter PINs */}
      {pin.length > 0 && pin.length < MAX_PIN_LENGTH && (
        <button
          onClick={() => handleSubmit(pin)}
          disabled={isLocked || isLoading}
          className="mt-6 w-full max-w-xs min-h-[56px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-40"
        >
          {isLoading ? "Checking…" : "Enter"}
        </button>
      )}

      {isLoading && (
        <p className="mt-4 text-sm text-[var(--color-foreground)]/50 animate-pulse">
          Checking PIN…
        </p>
      )}
    </main>
  );
}
