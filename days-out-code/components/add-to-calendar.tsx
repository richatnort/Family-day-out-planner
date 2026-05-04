'use client'

import { useRef, useState } from 'react'
import { buildGoogleCalendarUrl, buildOutlookCalendarUrl } from '@/lib/calendar'

interface AddToCalendarProps {
  activityId: number
  activityName: string
  locationName: string
  websiteUrl: string | null
  onClose: () => void
}

export default function AddToCalendar({
  activityId,
  activityName,
  locationName,
  websiteUrl,
  onClose,
}: AddToCalendarProps) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dateError, setDateError] = useState(false)
  const downloadRef = useRef<HTMLAnchorElement>(null)

  function requireDate(): boolean {
    if (!date) {
      setDateError(true)
      return false
    }
    setDateError(false)
    return true
  }

  function handleGoogleCalendar() {
    if (!requireDate()) return
    const url = buildGoogleCalendarUrl({
      name: activityName,
      locationName,
      date,
      time: time || undefined,
      websiteUrl: websiteUrl || undefined,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleOutlook() {
    if (!requireDate()) return
    const url = buildOutlookCalendarUrl({
      name: activityName,
      locationName,
      date,
      time: time || undefined,
      websiteUrl: websiteUrl || undefined,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleAppleCalendar() {
    if (!requireDate()) return
    const params = new URLSearchParams({ date })
    if (time) params.set('time', time)

    const res = await fetch(`/api/activities/${activityId}/calendar.ics?${params.toString()}`)
    if (!res.ok) return

    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)

    if (downloadRef.current) {
      downloadRef.current.href = objectUrl
      downloadRef.current.download = `${activityName.replace(/\s+/g, '-')}.ics`
      downloadRef.current.click()
      URL.revokeObjectURL(objectUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[var(--radius-xl)] p-6 pb-10 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />

        <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-foreground)] mb-5">
          Add to Calendar
        </h2>

        {/* Date input */}
        <div className="mb-4">
          <label
            htmlFor="cal-date"
            className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
          >
            Date <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            id="cal-date"
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value)
              if (e.target.value) setDateError(false)
            }}
            className={`border rounded-[var(--radius-md)] p-3 w-full text-base text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] ${
              dateError
                ? 'border-[var(--color-error)]'
                : 'border-[var(--color-border)]'
            }`}
          />
          {dateError && (
            <p className="text-[var(--color-error)] text-sm mt-1">
              Pick a date first
            </p>
          )}
        </div>

        {/* Time input */}
        <div className="mb-6">
          <label
            htmlFor="cal-time"
            className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
          >
            Time (optional)
          </label>
          <input
            id="cal-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 w-full text-base text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Calendar buttons */}
        <button
          type="button"
          onClick={handleGoogleCalendar}
          className="w-full min-h-[56px] rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-semibold flex items-center justify-center gap-2 mb-3"
        >
          Google Calendar
        </button>

        <button
          type="button"
          onClick={handleAppleCalendar}
          className="w-full min-h-[56px] rounded-[var(--radius-md)] bg-[var(--color-foreground)] text-white font-semibold flex items-center justify-center gap-2 mb-3"
        >
          Apple Calendar
        </button>

        <button
          type="button"
          onClick={handleOutlook}
          className="w-full min-h-[56px] rounded-[var(--radius-md)] text-white font-semibold flex items-center justify-center gap-2 mb-3"
          style={{ backgroundColor: '#0078D4' }}
        >
          Outlook
        </button>

        {/* Hidden anchor for .ics download */}
        <a ref={downloadRef} className="hidden" aria-hidden="true" />
      </div>
    </div>
  )
}
