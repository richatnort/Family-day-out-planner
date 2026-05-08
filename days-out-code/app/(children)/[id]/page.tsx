"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import VotePanel from "@/components/vote-panel";
import VoterNameModal from "@/components/voter-name-modal";
import MarkVisitedModal from "@/components/mark-visited-modal";
import AddToCalendar from "@/components/add-to-calendar";
import CostBadge from "@/components/cost-badge";
import { useToast } from "@/components/toast";

const ActivityMap = dynamic(() => import("@/components/activity-map"), { ssr: false });

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

interface VoteRow {
  id: number;
  activityId: number;
  emoji: string;
  voterName: string;
}

interface MembershipRow {
  membershipId: number;
  name: string;
  activityId: number;
}

const VOTER_NAME_KEY = "days-out-voter-name";

export default function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = React.use(params);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [mapExpanded, setMapExpanded] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showVisitModal, setShowVisitModal] = useState<boolean>(false);
  const [voterName, setVoterName] = useState<string | null>(null);
  const [showVoterModal, setShowVoterModal] = useState<boolean>(false);
  const [pendingVoteEmoji, setPendingVoteEmoji] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read voter name from localStorage (client-side only)
    const stored = localStorage.getItem(VOTER_NAME_KEY);
    if (stored) setVoterName(stored);
  }, []);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [activityRes, votesRes, membershipsRes] = await Promise.all([
          fetch(`/api/activities/${id}`),
          fetch(`/api/votes?activityId=${id}`),
          fetch("/api/memberships"),
        ]);

        if (activityRes.ok) {
          const data: Activity = await activityRes.json();
          setActivity(data);
        } else if (activityRes.status === 404) {
          setActivity(null);
        }

        if (votesRes.ok) {
          const data: VoteRow[] = await votesRes.json();
          setVotes(data);
        }

        if (membershipsRes.ok) {
          const data: MembershipRow[] = await membershipsRes.json();
          setMemberships(data);
        }
      } catch {
        showToast("Couldn't load activity — try refreshing");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, showToast]);

  async function refetchVotes() {
    try {
      const res = await fetch(`/api/votes?activityId=${id}`);
      if (res.ok) {
        const data: VoteRow[] = await res.json();
        setVotes(data);
      }
    } catch {
      // non-fatal
    }
  }

  async function castVote(activityId: number, emoji: string, name: string) {
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, emoji, voterName: name }),
      });
      if (!res.ok) throw new Error("Vote failed");
      await refetchVotes();
    } catch {
      showToast("Couldn't save your vote — try again");
    }
  }

  function handleVote(activityId: number, emoji: string) {
    if (!voterName) {
      setPendingVoteEmoji(emoji);
      setShowVoterModal(true);
      return;
    }
    castVote(activityId, emoji, voterName);
  }

  function handleVoterNameSubmit(name: string) {
    localStorage.setItem(VOTER_NAME_KEY, name);
    setVoterName(name);
    setShowVoterModal(false);
    if (pendingVoteEmoji) {
      castVote(Number(id), pendingVoteEmoji, name);
      setPendingVoteEmoji(null);
    }
  }

  async function handleMarkVisited(activityId: number, visitedDate: string, notes: string) {
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, notes, visitedDate }),
      });
      if (!res.ok) throw new Error("Passport stamp failed");
      setShowVisitModal(false);
      showToast("Adventure stamped!");
    } catch {
      showToast("Couldn't save stamp — try again");
    }
  }

  const coveringMembership = memberships
    .filter((m) => m.activityId === Number(id))
    .sort((a, b) => a.name.localeCompare(b.name))[0]?.name ?? null;

  // Loading skeleton
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] pb-24 animate-pulse">
        <div className="w-full aspect-video bg-[var(--color-muted)]" />
        <div className="px-4 pt-4 space-y-3">
          <div className="h-8 w-3/4 bg-[var(--color-muted)] rounded-[var(--radius-md)]" />
          <div className="h-4 w-1/2 bg-[var(--color-muted)] rounded-[var(--radius-md)]" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-[var(--color-muted)] rounded-full" />
            <div className="h-6 w-16 bg-[var(--color-muted)] rounded-full" />
          </div>
          <div className="h-32 bg-[var(--color-muted)] rounded-[var(--radius-lg)] mt-6" />
          <div className="h-14 bg-[var(--color-muted)] rounded-[var(--radius-md)]" />
          <div className="h-14 bg-[var(--color-muted)] rounded-[var(--radius-md)]" />
        </div>
      </main>
    );
  }

  // Not found
  if (!activity) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-[var(--color-foreground)]/60 text-lg">Activity not found</p>
        <button
          onClick={() => router.back()}
          className="text-[var(--color-primary)] font-semibold min-h-[44px] px-4"
        >
          ← Go back
        </button>
      </main>
    );
  }

  const weatherLabel =
    activity.weather === "rainy-friendly" ? "Rainy-friendly" : activity.weather === "both" ? "Any weather" : "Sunny";
  const settingLabel =
    activity.setting === "both" ? "Indoor & outdoor" : activity.setting === "indoor" ? "Indoor" : "Outdoor";

  return (
    <main className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Hero image */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 overflow-hidden">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl" aria-hidden="true">🌞</span>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-[var(--shadow-sm)] active:scale-95 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* Name */}
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          {activity.name}
        </h1>

        {/* Location */}
        <p className="text-sm text-[var(--color-foreground)]/60 flex items-center gap-1 mt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {activity.locationName}
        </p>

        {/* Tags row */}
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <CostBadge costTier={activity.costTier} coveringMembership={coveringMembership} />

          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)]/70">
            {activity.weather === "sunny" ? "☀️" : activity.weather === "rainy-friendly" ? "🌧️" : "🌤️"}
            {weatherLabel}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)]/70">
            {activity.setting === "indoor" ? "🏠" : activity.setting === "outdoor" ? "🌳" : "🏠🌳"}
            {settingLabel}
          </span>

          {coveringMembership && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
              🎫 {coveringMembership}
            </span>
          )}
        </div>

        {/* Prebooking badge */}
        {activity.prebookingRequired && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            📅 Pre-booking required
          </div>
        )}

        {/* Description */}
        {activity.description && (
          <p className="mt-3 text-sm text-[var(--color-foreground)]/70 leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Vote section */}
        <div className="mt-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-foreground)] mb-3">
            Family Vote
          </h2>
          <VotePanel
            activityId={activity.id}
            votes={votes}
            voterName={voterName}
            onVote={handleVote}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => setShowCalendar(true)}
            className="w-full min-h-[56px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-semibold text-base active:scale-95 transition-transform"
          >
            Add to Calendar
          </button>

          <button
            onClick={() => setShowVisitModal(true)}
            className="w-full min-h-[56px] rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-white font-semibold text-base active:scale-95 transition-transform"
          >
            We visited this! 🎉
          </button>

          {activity.websiteUrl && (
            <a
              href={activity.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[56px] rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-foreground)] font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              Visit Website
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* Map section */}
        {activity.lat && activity.lng && (
          <div className="mt-6">
            <button
              onClick={() => setMapExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-[var(--color-primary)] font-medium min-h-[44px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
              {mapExpanded ? "Hide map" : "Show on map"}
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
                className={`transition-transform duration-200 ${mapExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              className="overflow-hidden transition-all duration-300"
              style={{ height: mapExpanded ? "300px" : "0px" }}
            >
              {mapExpanded ? (
                <div className="h-[300px] rounded-[var(--radius-lg)] overflow-hidden mt-2">
                  <ActivityMap
                    lat={activity.lat!}
                    lng={activity.lng!}
                    name={activity.name}
                  />
                </div>
              ) : (
                <div className="h-[300px] bg-[var(--color-muted)] rounded-[var(--radius-lg)] flex items-center justify-center mt-2">
                  <p className="text-[var(--color-foreground)]/40 text-sm">Loading map…</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCalendar && (
        <AddToCalendar
          activityId={activity.id}
          activityName={activity.name}
          locationName={activity.locationName ?? ""}
          websiteUrl={activity.websiteUrl}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showVisitModal && (
        <MarkVisitedModal
          activityId={activity.id}
          activityName={activity.name}
          onConfirm={handleMarkVisited}
          onClose={() => setShowVisitModal(false)}
        />
      )}
      {showVoterModal && (
        <VoterNameModal
          onSubmit={handleVoterNameSubmit}
          onClose={() => setShowVoterModal(false)}
        />
      )}
    </main>
  );
}
