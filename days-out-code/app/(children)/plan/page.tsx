"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AddToCalendar from "@/components/add-to-calendar";

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

interface PlanActivity {
  id: number;
  name: string;
  imageUrl: string | null;
  isMystery: boolean;
  locationName: string | null;
  websiteUrl: string | null;
  costTier: string;
}

export default function PlanPage() {
  const [activities, setActivities] = useState<PlanActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarActivity, setCalendarActivity] = useState<PlanActivity | null>(null);

  useEffect(() => {
    fetch("/api/activities?plan=true")
      .then((r) => r.json())
      .then((data: PlanActivity[]) => { setActivities(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <>
      <main className="min-h-screen p-4 pt-6 pb-24 bg-[var(--color-background)]">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          This Week&apos;s Plan 📅
        </h1>
        <p className="text-sm text-[var(--color-foreground)]/50 mt-1">
          What&apos;s happening this week!
        </p>

        {isLoading && (
          <div className="mt-6 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] h-32 animate-pulse shadow-[var(--shadow-sm)]" />
            ))}
          </div>
        )}

        {!isLoading && activities.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-foreground)]/30" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-[var(--color-foreground)]/50 text-sm font-medium">
              Nothing confirmed yet — check back soon!
            </p>
          </div>
        )}

        {!isLoading && activities.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {activities.map((activity) =>
              activity.isMystery ? (
                <div
                  key={activity.id}
                  className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden flex items-center gap-4 p-4"
                >
                  <div className="w-16 h-16 rounded-[var(--radius-md)] bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-foreground)]/30 shrink-0">
                    <LockIcon />
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-foreground)]">
                      Mystery Adventure! 🔒
                    </p>
                    <p className="text-xs text-[var(--color-foreground)]/50 mt-0.5">
                      You&apos;ll find out on the day!
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={activity.id}
                  className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  {activity.imageUrl && (
                    <div className="relative w-full h-36 overflow-hidden">
                      <img
                        src={activity.imageUrl}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-foreground)]">
                      {activity.name}
                    </p>
                    {activity.locationName && (
                      <p className="text-xs text-[var(--color-foreground)]/50 mt-0.5">{activity.locationName}</p>
                    )}
                    <button
                      onClick={() => setCalendarActivity(activity)}
                      className="mt-3 px-4 py-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
                    >
                      Add to Calendar
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      {calendarActivity && (
        <AddToCalendar
          activityId={calendarActivity.id}
          activityName={calendarActivity.name}
          locationName={calendarActivity.locationName ?? ""}
          websiteUrl={calendarActivity.websiteUrl}
          onClose={() => setCalendarActivity(null)}
        />
      )}
    </>
  );
}
