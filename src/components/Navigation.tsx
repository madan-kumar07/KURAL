// Navigation.tsx — Bottom navigation bar (mobile-first)

import { motion } from 'framer-motion'
import { Home, FolderOpen, Clock, Settings } from 'lucide-react'

export type Page = 'home' | 'files' | 'activity' | 'settings'

interface NavigationProps {
  current: Page
  onChange: (page: Page) => void
}

const navItems: { id: Page; label: string; Icon: typeof Home; ariaLabel: string }[] = [
  { id: 'home',     label: 'Home',     Icon: Home,       ariaLabel: 'Go to Home' },
  { id: 'files',    label: 'Files',    Icon: FolderOpen, ariaLabel: 'Go to Files' },
  { id: 'activity', label: 'Activity', Icon: Clock,      ariaLabel: 'Go to Activity' },
  { id: 'settings', label: 'Settings', Icon: Settings,   ariaLabel: 'Go to Settings' },
]

export function Navigation({ current, onChange }: NavigationProps) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map(({ id, label, Icon, ariaLabel }) => {
        const isActive = current === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-label={ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative flex items-center justify-center p-1.5 rounded-full">
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-full -z-10 bg-cyan-500/20 border border-cyan-400/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </div>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
