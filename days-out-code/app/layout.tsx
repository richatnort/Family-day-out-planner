import type { Metadata } from "next";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "Days Out in Summer",
  description: "Family adventure planner for West & North Yorkshire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-[var(--color-background)] text-[var(--color-foreground)] font-[family-name:var(--font-body)] h-full">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
