'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface MarkVisitedModalProps {
  activityId: number
  activityName: string
  onConfirm: (activityId: number, visitedDate: string, notes: string) => void
  onClose: () => void
}

export default function MarkVisitedModal({
  activityId,
  activityName,
  onConfirm,
  onClose,
}: MarkVisitedModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [visitedDate, setVisitedDate] = useState(today)
  const [notes, setNotes] = useState('')

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(activityId, visitedDate, notes)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full rounded-[var(--radius-xl)] p-6 bg-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={20} />
        </button>

        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-foreground)] pr-10">
          We visited this!
        </h2>
        <p className="text-sm text-[var(--color-foreground)]/60 mt-1">
          {activityName}
        </p>

        <form onSubmit={handleConfirm} className="mt-4 flex flex-col gap-4">
          <div>
            <label
              htmlFor="visited-date"
              className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
            >
              Date visited
            </label>
            <input
              id="visited-date"
              type="date"
              value={visitedDate}
              min={today}
              onChange={(e) => setVisitedDate(e.target.value)}
              className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 w-full text-base text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="visited-notes"
              className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
            >
              Notes (optional)
            </label>
            <textarea
              id="visited-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes? (optional)"
              maxLength={200}
              rows={3}
              className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 w-full text-base text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-secondary)] text-white rounded-[var(--radius-md)] py-3 font-semibold min-h-[56px]"
          >
            Stamp Passport!
          </button>
        </form>
      </div>
    </div>
  )
}
