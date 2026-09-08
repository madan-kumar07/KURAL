// VoiceButton.tsx — The large central microphone orb

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Square } from 'lucide-react'
import type { SpeechState } from '../voice/SpeechEngine'

interface VoiceButtonProps {
  state: SpeechState
  isSupported: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
}

const stateConfig: Record<string, { label: string; color: string }> = {
  idle:                  { label: 'Tap to speak', color: 'rgba(0,136,255,0.15)' },
  requesting_permission: { label: 'Requesting access…', color: 'rgba(0,136,255,0.20)' },
  listening:             { label: 'Listening…', color: 'rgba(0,136,255,0.25)' },
  transcribing:          { label: 'Processing…', color: 'rgba(0,136,255,0.20)' },
  done:                  { label: 'Done', color: 'rgba(34,197,94,0.15)' },
  error:                 { label: 'Error', color: 'rgba(220,38,38,0.10)' },
  unsupported:           { label: 'Not supported', color: 'rgba(0,0,0,0.06)' },
}

export function VoiceButton({ state, isSupported, onClick, size = 'lg' }: VoiceButtonProps) {
  const isListening = state === 'listening'
  const isProcessing = state === 'transcribing' || state === 'requesting_permission'
  const isDisabled = !isSupported || state === 'unsupported'

  const orbSize = size === 'lg' ? 120 : size === 'md' ? 80 : 60
  const iconSize = size === 'lg' ? 40 : size === 'md' ? 28 : 20

  const config = stateConfig[state] || stateConfig.idle

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isDisabled ? undefined : onClick}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        aria-disabled={isDisabled}
        className="relative focus:outline-none"
        style={{ width: orbSize, height: orbSize }}
      >
        {/* Pulse rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                key="ring1"
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: 'rgba(0,136,255,0.30)' }}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                key="ring2"
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(0,136,255,0.18)' }}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.9, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main orb */}
        <motion.div
          className={`kural-orb ${isListening ? 'listening' : ''} w-full h-full`}
          animate={isListening ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={isListening ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          style={{
            background: isDisabled
              ? 'rgba(200,210,220,0.5)'
              : isListening
              ? 'linear-gradient(145deg, rgba(179,220,255,0.95), rgba(130,200,255,0.90))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(224,240,255,0.82))',
            boxShadow: isListening
              ? '0 0 0 3px rgba(0,136,255,0.35), 0 16px 56px rgba(0,136,255,0.40)'
              : '0 0 0 1px rgba(0,136,255,0.15), 0 8px 32px rgba(0,136,255,0.20)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <AnimatePresence mode="wait">
            {isDisabled ? (
              <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MicOff size={iconSize} color="#94a3b8" />
              </motion.div>
            ) : isListening ? (
              <motion.div key="stop" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Square size={iconSize - 4} fill="rgba(0,136,255,0.8)" color="rgba(0,136,255,0.8)" />
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: 'rgba(0,136,255,0.3)', borderTopColor: 'rgba(0,136,255,0.8)' }} />
              </motion.div>
            ) : (
              <motion.div key="mic" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <Mic size={iconSize} color="#0088ff" strokeWidth={1.8} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={config.label}
          className="text-sm font-medium text-ink-secondary text-center"
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
