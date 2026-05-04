interface CostBadgeProps {
  costTier: 'free' | 'cheap' | 'moderate' | 'premium'
  coveringMembership?: string | null
}

export default function CostBadge({ costTier, coveringMembership }: CostBadgeProps) {
  let label: string
  let bgColor: string

  switch (costTier) {
    case 'free':
      label = coveringMembership ? `FREE w/ ${coveringMembership}` : 'FREE'
      bgColor = 'var(--color-secondary)'
      break
    case 'cheap':
      label = 'Cheap'
      bgColor = 'var(--color-primary)'
      break
    case 'moderate':
      label = 'Moderate'
      bgColor = 'var(--color-accent)'
      break
    case 'premium':
      label = 'Premium'
      bgColor = 'var(--color-error)'
      break
  }

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: bgColor }}
    >
      {label}
    </span>
  )
}
