'use client'

interface FilterChipsProps {
  activeWeather: ('sunny' | 'rainy')[]
  activeSetting: ('indoor' | 'outdoor')[]
  activeCostTier: ('free' | 'cheap' | 'moderate' | 'premium')[]
  onToggleWeather: (val: 'sunny' | 'rainy') => void
  onToggleSetting: (val: 'indoor' | 'outdoor') => void
  onToggleCostTier: (val: 'free' | 'cheap' | 'moderate' | 'premium') => void
}

const chipBase =
  'px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap cursor-pointer min-h-[44px] flex items-center'
const activeChip =
  'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
const inactiveChip =
  'bg-white text-[var(--color-foreground)] border-[var(--color-border)]'

export default function FilterChips({
  activeWeather,
  activeSetting,
  activeCostTier,
  onToggleWeather,
  onToggleSetting,
  onToggleCostTier,
}: FilterChipsProps) {
  const weatherChips: { val: 'sunny' | 'rainy'; label: string }[] = [
    { val: 'sunny', label: '☀️ Sunny' },
    { val: 'rainy', label: '🌧 Rainy' },
  ]

  const settingChips: { val: 'indoor' | 'outdoor'; label: string }[] = [
    { val: 'indoor', label: '🏠 Indoor' },
    { val: 'outdoor', label: '🌳 Outdoor' },
  ]

  const costTierChips: { val: 'free' | 'cheap' | 'moderate' | 'premium'; label: string }[] = [
    { val: 'free',     label: '🆓 Free' },
    { val: 'cheap',    label: '💚 Cheap' },
    { val: 'moderate', label: '🟡 Moderate' },
    { val: 'premium',  label: '💎 Premium' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {weatherChips.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onToggleWeather(val)}
          className={`${chipBase} ${activeWeather.includes(val) ? activeChip : inactiveChip}`}
        >
          {label}
        </button>
      ))}
      {settingChips.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onToggleSetting(val)}
          className={`${chipBase} ${activeSetting.includes(val) ? activeChip : inactiveChip}`}
        >
          {label}
        </button>
      ))}
      {costTierChips.map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() => onToggleCostTier(val)}
          className={`${chipBase} ${activeCostTier.includes(val) ? activeChip : inactiveChip}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
