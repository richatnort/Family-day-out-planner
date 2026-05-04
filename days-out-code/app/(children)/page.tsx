"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ActivityCard from "@/components/activity-card";
import FilterChips from "@/components/filter-chips";
import { useToast } from "@/components/toast";

interface Activity {
  id: number;
  name: string;
  imageUrl: string | null;
  costTier: "free" | "cheap" | "moderate" | "premium";
  weather: "sunny" | "rainy-friendly" | "both";
  setting: "indoor" | "outdoor" | "both";
  lat: string | null;
  lng: string | null;
  locationName: string;
  websiteUrl: string | null;
  description: string | null;
  ageMin: number | null;
  ageMax: number | null;
  prebookingRequired: boolean;
  category: string;
}

interface MembershipRow {
  membershipId: number;
  name: string;
  activityId: number;
}

export default function BrowsePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [activeWeather, setActiveWeather] = useState<("sunny" | "rainy")[]>([]);
  const [activeSetting, setActiveSetting] = useState<("indoor" | "outdoor")[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch wishlist and memberships once on mount
  useEffect(() => {
    async function fetchStaticData() {
      try {
        const [wishlistRes, membershipsRes] = await Promise.all([
          fetch("/api/wishlist"),
          fetch("/api/memberships"),
        ]);
        if (wishlistRes.ok) {
          const data: { activityId: number }[] = await wishlistRes.json();
          setWishlist(data.map((w) => w.activityId));
        }
        if (membershipsRes.ok) {
          const data: MembershipRow[] = await membershipsRes.json();
          setMemberships(data);
        }
      } catch {
        // non-fatal: wishlist/memberships are supplementary
      }
    }
    fetchStaticData();
  }, []);

  // Fetch activities whenever filters change
  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      activeWeather.forEach((w) => params.append("weather", w));
      activeSetting.forEach((s) => params.append("setting", s));
      const res = await fetch(`/api/activities?${params.toString()}`);
      if (res.ok) {
        const data: Activity[] = await res.json();
        setActivities(data);
      }
    } catch {
      showToast("Couldn't load activities — try refreshing");
    } finally {
      setIsLoading(false);
    }
  }, [activeWeather, activeSetting, showToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function getCoveringMembership(activityId: number): string | null {
    const sorted = [...memberships]
      .filter((m) => m.activityId === activityId)
      .sort((a, b) => a.name.localeCompare(b.name));
    return sorted[0]?.name ?? null;
  }

  async function handleWishlistToggle(activityId: number, _currentState?: boolean) {
    const isWishlisted = wishlist.includes(activityId);
    // Optimistic update
    setWishlist((prev) =>
      isWishlisted ? prev.filter((id) => id !== activityId) : [...prev, activityId]
    );

    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist/${activityId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove");
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityId }),
        });
        if (!res.ok) throw new Error("Failed to add");
      }
    } catch {
      // Revert optimistic update
      setWishlist((prev) =>
        isWishlisted ? [...prev, activityId] : prev.filter((id) => id !== activityId)
      );
      showToast("Couldn't update wishlist — try again");
    }
  }

  function handleSurpriseMe() {
    if (activities.length === 0) {
      showToast("No adventures match these filters — try removing one!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * activities.length);
    const activity = activities[randomIndex];
    router.push(`/${activity.id}`);
  }

  const hasActiveFilters = activeWeather.length > 0 || activeSetting.length > 0;

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Sticky header */}
      <header className="sticky top-0 bg-[var(--color-background)] z-30 px-4 pt-6 pb-3 shadow-[var(--shadow-sm)]">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Days Out 🌞
        </h1>
        <div className="mt-3 flex gap-2 items-center">
          <FilterChips
            activeWeather={activeWeather}
            activeSetting={activeSetting}
            onToggleWeather={(val) =>
              setActiveWeather((prev) =>
                prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
              )
            }
            onToggleSetting={(val) =>
              setActiveSetting((prev) =>
                prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
              )
            }
          />
          <button
            onClick={handleSurpriseMe}
            className="ml-auto shrink-0 bg-[var(--color-accent)] text-white px-4 py-2 rounded-full min-h-[44px] text-sm font-semibold active:scale-95 transition-transform whitespace-nowrap"
          >
            Surprise Me!
          </button>
        </div>
      </header>

      {/* Activity grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg)] bg-[var(--color-muted)] animate-pulse"
              style={{ aspectRatio: "3/4" }}
            />
          ))}

        {!isLoading && activities.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-3">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <p className="text-[var(--color-foreground)]/50 text-sm">
              {hasActiveFilters
                ? "No adventures match these filters — try removing one!"
                : "No adventures to explore yet — check back soon!"}
            </p>
          </div>
        )}

        {!isLoading &&
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              id={activity.id}
              name={activity.name}
              imageUrl={activity.imageUrl}
              costTier={activity.costTier}
              weather={activity.weather}
              setting={activity.setting}
              isWishlisted={wishlist.includes(activity.id)}
              coveringMembership={getCoveringMembership(activity.id)}
              onWishlistToggle={handleWishlistToggle}
              onClick={() => router.push(`/${activity.id}`)}
            />
          ))}
      </div>
    </main>
  );
}
