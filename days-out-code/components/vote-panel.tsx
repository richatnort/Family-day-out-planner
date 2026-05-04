'use client'

interface VotePanelProps {
  activityId: number
  votes: Array<{ emoji: string; voterName: string }>
  voterName: string | null
  onVote: (activityId: number, emoji: string) => void
}

const VOTE_OPTIONS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Love it' },
  { emoji: '😐', label: 'Maybe' },
  { emoji: '😴', label: 'Not for me' },
]

export default function VotePanel({
  activityId,
  votes,
  voterName,
  onVote,
}: VotePanelProps) {
  return (
    <div className="flex gap-3">
      {VOTE_OPTIONS.map(({ emoji, label }) => {
        const count = votes.filter((v) => v.emoji === emoji).length
        const isSelected = voterName
          ? votes.some((v) => v.voterName === voterName && v.emoji === emoji)
          : false

        return (
          <button
            key={emoji}
            type="button"
            aria-label={label}
            aria-pressed={isSelected}
            onClick={() => onVote(activityId, emoji)}
            className={`min-w-[56px] min-h-[56px] flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 transition-all px-3 ${
              isSelected
                ? 'border-[var(--color-primary)] bg-[var(--color-muted)]'
                : 'border-[var(--color-border)] bg-white'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold mt-0.5">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
