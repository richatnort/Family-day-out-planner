'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Stamp, ThumbsUp } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Explore' },
  { href: '/passport', icon: Stamp, label: 'Passport' },
  { href: '/vote', icon: ThumbsUp, label: 'Vote' },
] as const

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] z-40 safe-area-inset-bottom">
      <div className="grid grid-cols-3">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 min-h-[56px] text-xs gap-1 ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-foreground)]/50'
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
