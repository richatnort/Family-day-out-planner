'use client'

import { Heart, MapPin, Sun, CloudRain, Home, Trees } from 'lucide-react'
import CostBadge from './cost-badge'

interface ActivityCardProps {
  id: number
  name: string
  imageUrl: string | null
  costTier: 'free' | 'cheap' | 'moderate' | 'premium'
  weather: 'sunny' | 'rainy-friendly' | 'both'
  setting: 'indoor' | 'outdoor' | 'both'
  coveringMembership?: string | null
  isWishlisted: boolean
  onWishlistToggle: (id: number, currentState: boolean) => void
  onClick: () => void
}

export default function ActivityCard({
  id,
  name,
  imageUrl,
  costTier,
  weather,
  setting,
  coveringMembership,
  isWishlisted,
  onWishlistToggle,
  onClick,
}: ActivityCardProps) {
  const showSun = weather === 'sunny' || weather === 'both'
  const showRain = weather === 'rainy-friendly' || weather === 'both'
  const showIndoor = setting === 'indoor' || setting === 'both'
  const showOutdoor = setting === 'outdoor' || setting === 'both'

  return (
    <div
      onClick={onClick}
      className="rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)] bg-white cursor-pointer active:scale-95 transition-transform duration-150"
    >
      {/* Image area */}
      <div className="relative aspect-video">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
            <MapPin size={24} color="white" />
          </div>
        )}

        {/* Heart / wishlist button */}
        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation()
            onWishlistToggle(id, isWishlisted)
          }}
          className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/80"
        >
          {isWishlisted ? (
            <Heart
              size={20}
              fill="var(--color-accent)"
              color="var(--color-accent)"
            />
          ) : (
            <Heart size={20} color="var(--color-foreground)" />
          )}
        </button>

        {/* Cost badge */}
        <div className="absolute bottom-2 left-2">
          <CostBadge costTier={costTier} coveringMembership={coveringMembership} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="font-[family-name:var(--font-heading)] text-base font-semibold truncate">
          {name}
        </p>
        <div className="flex gap-2 mt-1 text-xs">
          {showSun && <Sun size={14} />}
          {showRain && <CloudRain size={14} />}
          {showIndoor && <Home size={14} />}
          {showOutdoor && <Trees size={14} />}
        </div>
      </div>
    </div>
  )
}
