// App.tsx — Root application frame

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
    <div className="min-h-dvh flex flex-col relative bg-[#07090e] text-slate-100">
      {/* ── Global header ─── */}
      <header className="kural-header" role="banner">
        <KuralLogo size="md" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="status-dot" aria-label="KURAL online" />
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Local AI</span>
          </div>
          <button
            onClick={() => setPage('settings')}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            aria-label="Open Settings"
          >
            <SettingsIcon size={16} color="#94a3b8" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Page content ─── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
