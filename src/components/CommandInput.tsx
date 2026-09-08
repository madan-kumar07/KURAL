// CommandInput.tsx — Text input with send button

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, X } from 'lucide-react'

interface CommandInputProps {
  value: string
  onChange: (v: string) => void
  onSubmit: (text: string) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
}

export function CommandInput({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Or type a command…',
  disabled = false,
  autoFocus = false,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = () => {
    const text = value.trim()
    if (text && !disabled) {
      onSubmit(text)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      className="relative flex items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Type a command"
        className="kural-input pr-24"
        style={{ paddingRight: value ? '5.5rem' : '3.5rem' }}
      />

      {/* Clear button */}
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-14 p-1.5 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Clear input"
        >
          <X size={14} color="rgba(13,31,53,0.4)" />
        </motion.button>
      )}

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Send command"
        className="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: value.trim() && !disabled
            ? 'linear-gradient(135deg, #0088ff, #006dcc)'
            : 'rgba(0,0,0,0.06)',
          boxShadow: value.trim() ? '0 2px 8px rgba(0,136,255,0.30)' : 'none',
          cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <Send
          size={16}
          color={value.trim() && !disabled ? 'white' : 'rgba(13,31,53,0.3)'}
          strokeWidth={2}
        />
      </button>
    </motion.div>
  )
}
