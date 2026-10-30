'use client'

import { useState } from 'react'

interface Activity {
  id: number
  name: string
}

export default function RandomPicker({ activities }: { activities: Activity[] }) {
  const [picked, setPicked] = useState<Activity | null>(null)

  function pickRandom() {
    const idx = Math.floor(Math.random() * activities.length)
    setPicked(activities[idx])
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
      <button
        type="button"
        onClick={pickRandom}
        className="w-full py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        🎲 {picked ? 'Pick again' : "Can't decide? Pick at random"}
      </button>
      {picked && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-muted)] px-4 py-3 text-center">
          <p className="text-xs text-[var(--color-foreground)]/50 mb-1">The random pick is…</p>
          <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--color-primary)]">
            {picked.name}
          </p>
        </div>
      )}
    </div>
  )
}
