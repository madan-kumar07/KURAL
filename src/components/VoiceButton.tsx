// VoiceButton.tsx — The large central glowing voice orb

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square } from 'lucide-react'
import type { SpeechState } from '../voice/SpeechEngine'

interface VoiceButtonProps {
  state: SpeechState
  isSupported: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
}

const stateConfig: Record<string, { label: string }> = {
  idle:                  { label: 'Tap to speak' },
  requesting_permission: { label: 'Requesting access…' },
  listening:             { label: 'Listening…' },
  transcribing:          { label: 'Processing…' },
  done:                  { label: 'Done' },
  error:                 { label: 'Error' },
  unsupported:           { label: 'Not supported' },
}

export function VoiceButton({ state, isSupported, onClick, size = 'lg' }: VoiceButtonProps) {
  const isListening = state === 'listening'
  const isProcessing = state === 'transcribing' || state === 'requesting_permission'
  const isDisabled = !isSupported || state === 'unsupported'

  const orbSize = size === 'lg' ? 104 : size === 'md' ? 76 : 56
  const iconSize = size === 'lg' ? 36 : size === 'md' ? 26 : 20

  const config = stateConfig[state] || stateConfig.idle

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="kural-orb-container relative">
        <button
          onClick={isDisabled ? undefined : onClick}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          aria-disabled={isDisabled}
          className="kural-orb-btn"
          style={{ width: orbSize, height: orbSize }}
        >
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  key="ring1"
                  className="absolute inset-0 rounded-full border-2 border-cyan-400/50"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  key="ring2"
                  className="absolute inset-0 rounded-full border border-indigo-400/40"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Main orb */}
          <motion.div
            className={`kural-orb ${isListening ? 'listening' : ''}`}
            animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={isListening ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
            style={{ opacity: isDisabled ? 0.4 : 1 }}
          >
            <AnimatePresence mode="wait">
              {isDisabled ? (
                <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MicOff size={iconSize} color="#64748b" />
                </motion.div>
              ) : isListening ? (
                <motion.div key="stop" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                  <Square size={iconSize - 4} fill="#ffffff" color="#ffffff" />
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  key="processing"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-7 h-7 rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                </motion.div>
              ) : (
                <motion.div key="mic" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <Mic size={iconSize} color="#ffffff" strokeWidth={2} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </div>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={config.label}
          className="text-xs font-semibold text-ink-secondary text-center tracking-wide"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {isDisabled ? 'Voice not available' : config.label}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
