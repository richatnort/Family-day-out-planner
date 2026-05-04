'use client'

import { useState } from 'react'

interface VoterNameModalProps {
  onSubmit: (name: string) => void
  onClose: () => void
}

export default function VoterNameModal({ onSubmit, onClose }: VoterNameModalProps) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-xs w-full rounded-[var(--radius-xl)] p-6 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-foreground)]">
          What&apos;s your name?
        </h2>
        <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-foreground)]/60 mt-1">
          So we know who&apos;s voting!
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            autoFocus
            className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 w-full text-lg mt-4 text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="submit"
            disabled={name.trim().length === 0}
            className="bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] py-3 font-semibold min-h-[56px] w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Let&apos;s go!
          </button>
        </form>
      </div>
    </div>
  )
}
