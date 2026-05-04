"use client";

import { useState, useEffect } from "react";
import VotePanel from "@/components/vote-panel";
import VoterNameModal from "@/components/voter-name-modal";
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

interface VoteRow {
  id: number;
  activityId: number;
  emoji: string;
  voterName: string;
}

const VOTER_NAME_KEY = "days-out-voter-name";

export default function VotePage() {
  const { showToast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [voterName, setVoterName] = useState<string | null>(null);
  const [showVoterModal, setShowVoterModal] = useState<boolean>(false);
  const [pendingVote, setPendingVote] = useState<{ activityId: number; emoji: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem(VOTER_NAME_KEY);
    if (stored) setVoterName(stored);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [activitiesRes, votesRes] = await Promise.all([
          fetch("/api/activities"),
          fetch("/api/votes"),
        ]);

        if (activitiesRes.ok) {
          const data: Activity[] = await activitiesRes.json();
          setActivities(data);
        }

        if (votesRes.ok) {
          const data: VoteRow[] = await votesRes.json();
          setVotes(data);
        }
      } catch {
        showToast("Couldn't load votes — try refreshing");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [showToast]);

  function getVotesForActivity(activityId: number): VoteRow[] {
    return votes.filter((v) => v.activityId === activityId);
  }

  async function castVote(activityId: number, emoji: string, name: string) {
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, emoji, voterName: name }),
      });
      if (!res.ok) throw new Error("Vote failed");

      // Re-fetch all votes to stay in sync
      const updated = await fetch("/api/votes");
      if (updated.ok) {
        const data: VoteRow[] = await updated.json();
        setVotes(data);
      }
    } catch {
      showToast("Couldn't save your vote — try again");
    }
  }

  function handleVote(activityId: number, emoji: string) {
    if (!voterName) {
      setPendingVote({ activityId, emoji });
      setShowVoterModal(true);
      return;
    }
    castVote(activityId, emoji, voterName);
  }

  function handleVoterNameSubmit(name: string) {
    localStorage.setItem(VOTER_NAME_KEY, name);
    setVoterName(name);
    setShowVoterModal(false);
    if (pendingVote) {
      castVote(pendingVote.activityId, pendingVote.emoji, name);
      setPendingVote(null);
    }
  }

  return (
    <>
      <main className="min-h-screen p-4 pt-6 bg-[var(--color-background)]">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--color-foreground)]">
          Family Vote 🗳️
        </h1>
        <p className="text-sm text-[var(--color-foreground)]/50 mt-1">
          What shall we do next?
        </p>

        {isLoading && (
          <div className="mt-6 flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)] animate-pulse h-28"
              />
            ))}
          </div>
        )}

        {!isLoading && activities.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center">
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            <p className="text-[var(--color-foreground)]/50 text-sm">
              No adventures to vote on yet!
            </p>
          </div>
        )}

        {!isLoading && activities.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]"
              >
                <p className="font-[family-name:var(--font-heading)] font-semibold text-base text-[var(--color-foreground)]">
                  {activity.name}
                </p>
                <p className="text-xs text-[var(--color-foreground)]/60 mb-3">
                  {activity.locationName}
                </p>
                <VotePanel
                  activityId={activity.id}
                  votes={getVotesForActivity(activity.id)}
                  voterName={voterName}
                  onVote={handleVote}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {showVoterModal && (
        <VoterNameModal
          onSubmit={handleVoterNameSubmit}
          onClose={() => setShowVoterModal(false)}
        />
      )}
    </>
  );
}
