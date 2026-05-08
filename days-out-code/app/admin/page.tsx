import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { activities, memberships, votes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";

function expiryStatus(expiresAt: string | null): "active" | "soon" | "expired" {
  if (!expiresAt) return "active";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return "expired";
  if (diff < 30 * 24 * 60 * 60 * 1000) return "soon";
  return "active";
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-green-500",
  soon: "bg-amber-400",
  expired: "bg-red-500",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") redirect("/login");

  // Activity counts by category
  const categoryCounts = await db
    .select({ category: activities.category, count: sql<number>`count(*)::int` })
    .from(activities)
    .where(eq(activities.isActive, true))
    .groupBy(activities.category);

  // Vote summary for considering activities
  const consideringActivities = await db
    .select()
    .from(activities)
    .where(and(eq(activities.isActive, true), eq(activities.isConsidering, true)));

  const allVotes = consideringActivities.length > 0
    ? await db.select().from(votes)
    : [];

  const voteSummary = consideringActivities
    .map((a) => {
      const av = allVotes.filter((v) => v.activityId === a.id);
      return {
        id: a.id,
        name: a.name,
        love: av.filter((v) => v.emoji === "👍").length,
        maybe: av.filter((v) => v.emoji === "😐").length,
        pass: av.filter((v) => v.emoji === "😴").length,
      };
    })
    .sort((a, b) => b.love - a.love)
    .slice(0, 10);

  // Expiry alerts
  const allMemberships = await db.select().from(memberships);
  const expiryAlerts = allMemberships
    .map((m) => ({ ...m, status: expiryStatus(m.expiresAt) }))
    .filter((m) => m.status === "soon" || m.status === "expired")
    .sort((a, b) => {
      if (a.status === "expired" && b.status !== "expired") return -1;
      if (b.status === "expired" && a.status !== "expired") return 1;
      return new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime();
    });

  const totalActive = categoryCounts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Dashboard
        </h1>
        <Link
          href="/admin/activities/new"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Add activity
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Activity counts */}
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] md:col-span-1">
          <h2 className="font-semibold text-sm text-[var(--color-foreground)]/60 uppercase tracking-wide mb-4">
            Activities by Category
          </h2>
          <p className="text-3xl font-bold text-[var(--color-primary)] mb-4">{totalActive} total</p>
          <table className="w-full text-sm">
            <tbody>
              {categoryCounts
                .sort((a, b) => b.count - a.count)
                .map(({ category, count }) => (
                  <tr key={category} className="border-t border-[var(--color-border)]">
                    <td className="py-1.5 capitalize text-[var(--color-foreground)]/80">{category}</td>
                    <td className="py-1.5 text-right font-semibold text-[var(--color-foreground)]">{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Vote summary */}
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] md:col-span-2">
          <h2 className="font-semibold text-sm text-[var(--color-foreground)]/60 uppercase tracking-wide mb-4">
            This Week&apos;s Vote — Shortlisted
          </h2>
          {voteSummary.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground)]/50">
              No activities shortlisted yet. Toggle &ldquo;Considering&rdquo; on activities to start.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-foreground)]/50 text-xs">
                  <th className="text-left pb-2">Activity</th>
                  <th className="text-right pb-2">👍</th>
                  <th className="text-right pb-2">😐</th>
                  <th className="text-right pb-2">😴</th>
                </tr>
              </thead>
              <tbody>
                {voteSummary.map((v) => (
                  <tr key={v.id} className="border-t border-[var(--color-border)]">
                    <td className="py-1.5 text-[var(--color-foreground)]/80 truncate max-w-[200px]">{v.name}</td>
                    <td className="py-1.5 text-right font-semibold text-[var(--color-secondary)]">{v.love}</td>
                    <td className="py-1.5 text-right text-[var(--color-foreground)]/60">{v.maybe}</td>
                    <td className="py-1.5 text-right text-[var(--color-foreground)]/40">{v.pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expiry alerts */}
      {expiryAlerts.length > 0 && (
        <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)]">
          <h2 className="font-semibold text-sm text-[var(--color-foreground)]/60 uppercase tracking-wide mb-4">
            Membership Expiry Alerts
          </h2>
          <div className="flex flex-col gap-2">
            {expiryAlerts.map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[m.status]}`} />
                <span className="font-medium text-[var(--color-foreground)]">{m.name}</span>
                <span className="text-[var(--color-foreground)]/50">
                  {m.status === "expired"
                    ? `Expired ${new Date(m.expiresAt!).toLocaleDateString("en-GB")}`
                    : `Expires ${new Date(m.expiresAt!).toLocaleDateString("en-GB")}`}
                </span>
                <Link
                  href="/admin/memberships"
                  className="ml-auto text-[var(--color-primary)] hover:underline text-xs"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
