"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/toast";

interface StampRow {
  id: number;
  activityId: number;
  activityName: string;
  imageUrl: string | null;
  visitedDate: string;
  notes: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PassportPage() {
  const { showToast } = useToast();

  const [stamps, setStamps] = useState<StampRow[]>([]);
  const [totalActivities, setTotalActivities] = useState<number>(0);
  const [selectedStamp, setSelectedStamp] = useState<StampRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [passportRes, activitiesRes] = await Promise.all([
          fetch("/api/passport"),
          fetch("/api/activities"),
        ]);

        if (passportRes.ok) {
          const data: StampRow[] = await passportRes.json();
          setStamps(data);
        }

        if (activitiesRes.ok) {
          const data: unknown[] = await activitiesRes.json();
          setTotalActivities(data.length);
        }
      } catch {
        showToast("Couldn't load passport — try refreshing");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [showToast]);

  const uniqueVisited = new Set(stamps.map((s) => s.activityId)).size;
  const progressPercent = totalActivities > 0
    ? Math.round((uniqueVisited / totalActivities) * 100)
    : 0;

  return (
    <>
      <main className="min-h-screen p-4 pt-6 bg-[var(--color-background)]">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Adventure Passport 🗺️
        </h1>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-[var(--color-muted)] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[var(--color-secondary)] h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-[var(--color-foreground)]/60 mt-1.5">
            {uniqueVisited} of {totalActivities} adventures visited
          </p>
        </div>

        {/* Stamp grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-lg)] bg-[var(--color-muted)] animate-pulse"
                style={{ aspectRatio: "1 / 1.1" }}
              />
            ))}

          {!isLoading && stamps.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--color-foreground)]/30"
                aria-hidden="true"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <p className="text-[var(--color-foreground)]/50 text-sm">
                No stamps yet — go on an adventure!
              </p>
            </div>
          )}

          {!isLoading &&
            stamps.map((stamp) => (
              <div
                key={stamp.id}
                onClick={() => setSelectedStamp(stamp)}
                className="rounded-[var(--radius-lg)] overflow-hidden bg-white shadow-[var(--shadow-sm)] cursor-pointer active:scale-95 transition-transform"
              >
                {/* Image or gradient */}
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
                  {stamp.imageUrl ? (
                    <img
                      src={stamp.imageUrl}
                      alt={stamp.activityName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl" aria-hidden="true">🌟</span>
                    </div>
                  )}
                  {/* Stamp overlay */}
                  <div className="absolute top-2 right-2 bg-[var(--color-secondary)] text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                    ✓
                  </div>
                </div>
                <div className="p-2">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                    {stamp.activityName}
                  </p>
                  <p className="text-xs text-[var(--color-foreground)]/50 mt-0.5">
                    {formatDate(stamp.visitedDate)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </main>

      {/* Stamp detail overlay */}
      {selectedStamp && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStamp(null)}
        >
          <div
            className="bg-white rounded-[var(--radius-xl)] max-w-sm w-full overflow-hidden shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero image or gradient */}
            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
              {selectedStamp.imageUrl ? (
                <img
                  src={selectedStamp.imageUrl}
                  alt={selectedStamp.activityName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl" aria-hidden="true">🌟</span>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedStamp(null)}
                aria-label="Close"
                className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center shadow-[var(--shadow-sm)] active:scale-95 transition-transform"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-foreground)]">
                {selectedStamp.activityName}
              </h2>
              <p className="text-sm text-[var(--color-foreground)]/60 mt-1">
                Visited: {formatDate(selectedStamp.visitedDate)}
              </p>
              {selectedStamp.notes && (
                <p className="text-sm mt-2 text-[var(--color-foreground)]/70 leading-relaxed">
                  {selectedStamp.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
