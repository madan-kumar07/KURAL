// FilePicker.tsx — Real file picker with dark theme styling

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
        className="glass-card-blue rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer text-center transition-all border-dashed"
        style={{ borderWidth: 1.5 }}
      >
        {input}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-500/20 text-cyan-400">
          <Upload size={22} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-100">Add files to KURAL</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Drop files here or tap to browse
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
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
        className="btn-primary text-xs py-2 px-4"
        aria-label="Add files"
      >
        <Plus size={16} />
        Add files
      </button>
    </>
  )
}
