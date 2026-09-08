// FilePicker.tsx — Real file picker using <input type="file">

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload } from 'lucide-react'

interface FilePickerProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
  variant?: 'button' | 'drop-zone'
}

export function FilePicker({ onFiles, disabled = false, variant = 'button' }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFiles(files)
      // Reset so same files can be re-added
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Hidden input
  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
      onChange={handleChange}
      className="sr-only"
      aria-label="Add files"
    />
  )

  if (variant === 'drop-zone') {
    return (
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="glass-card-blue rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer text-center transition-all"
        style={{ borderStyle: 'dashed', borderColor: 'rgba(0,136,255,0.25)', borderWidth: 1.5 }}
      >
        {input}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,136,255,0.10)' }}
        >
          <Upload size={24} color="#0088ff" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Add files to KURAL</p>
          <p className="text-xs text-ink-secondary mt-1">
            Drop files here or tap to browse
          </p>
          <p className="text-xs text-ink-tertiary mt-1">
            PDF, images, documents · max 10 MB each
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {input}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="btn-primary"
        aria-label="Add files"
      >
        <Plus size={18} />
        Add files
      </button>
    </>
  )
}
