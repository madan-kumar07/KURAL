// App.tsx — Root application with page routing and global header

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KuralLogo } from './components/KuralLogo'
import { Navigation, type Page } from './components/Navigation'
import { Home } from './pages/Home'
import { Files } from './pages/Files'
import { Activity } from './pages/Activity'
import { Settings, type VoiceLanguage } from './pages/Settings'
import { Settings as SettingsIcon } from 'lucide-react'

export default function App() {
  const [page, setPage]                 = useState<Page>('home')
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en-IN')

  return (
    <div className="min-h-dvh flex flex-col relative">
      {/* ── Global header ─── */}
      <header className="kural-header" role="banner">
        <KuralLogo size="md" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="status-dot" aria-label="KURAL online" />
            <span className="text-xs text-ink-tertiary hidden sm:inline">Local</span>
          </div>
          <button
            onClick={() => setPage('settings')}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
            aria-label="Open Settings"
          >
            <SettingsIcon size={18} color="rgba(15, 23, 42, 0.6)" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Page content ─── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {page === 'home' && (
              <Home
                voiceLanguage={voiceLanguage}
                onNavigateToFiles={() => setPage('files')}
                onNavigate={setPage}
              />
            )}
            {page === 'files'    && <Files />}
            {page === 'activity' && <Activity />}
            {page === 'settings' && (
              <Settings
                voiceLanguage={voiceLanguage}
                onLanguageChange={setVoiceLanguage}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom navigation ─── */}
      <Navigation current={page} onChange={setPage} />
    </div>
  )
}
