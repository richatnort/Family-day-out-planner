import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center gap-6">
        <span className="font-[family-name:var(--font-heading)] font-bold text-lg text-[var(--color-foreground)]">
          Days Out — Admin
        </span>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/admin"
            className="text-[var(--color-foreground)]/70 hover:text-[var(--color-primary)] font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/activities"
            className="text-[var(--color-foreground)]/70 hover:text-[var(--color-primary)] font-medium transition-colors"
          >
            Activities
          </Link>
          <Link
            href="/admin/memberships"
            className="text-[var(--color-foreground)]/70 hover:text-[var(--color-primary)] font-medium transition-colors"
          >
            Memberships
          </Link>
        </nav>
        <form
          action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/login" });
          }}
          className="ml-auto"
        >
          <button
            type="submit"
            className="text-xs text-[var(--color-foreground)]/50 hover:text-[var(--color-foreground)] transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="px-6 py-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
