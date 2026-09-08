// FileCard.tsx — Single file card for Files page

import { motion } from 'framer-motion'
import { FileText, Image, File, FileType, Trash2, Eye } from 'lucide-react'
import type { FileRecord } from '../data/FileRepository'
import { formatFileSize } from '../files/FileIndexer'

interface FileCardProps {
  file: FileRecord
  onClick?: () => void
  onDelete?: () => void
  isSelected?: boolean
}

function FileTypeIcon({ type, mimeType }: { type: string; mimeType: string }) {
  const size = 20
  if (type === 'pdf' || mimeType.includes('pdf')) {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/15 text-red-400">
        <FileType size={size} strokeWidth={1.8} />
      </div>
    )
  }
  if (type === 'image') {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-400">
        <Image size={size} strokeWidth={1.8} />
      </div>
    )
  }
  if (type === 'document') {
    return (
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/15 text-cyan-400">
        <FileText size={size} strokeWidth={1.8} />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-500/15 text-slate-400">
      <File size={size} strokeWidth={1.8} />
    </div>
  )
}

export function FileCard({ file, onClick, onDelete, isSelected }: FileCardProps) {
  const date = new Date(file.modifiedTime)
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <motion.div
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-4 cursor-pointer group"
      style={{
        border: isSelected
          ? '1px solid rgba(56,189,248,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isSelected
          ? '0 4px 20px rgba(56,189,248,0.2)'
          : undefined,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-3">
        <FileTypeIcon type={file.type} mimeType={file.mimeType} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-100 truncate leading-snug">{file.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="kural-badge text-[10px]">{file.type.toUpperCase()}</span>
            <span className="text-[10px] text-slate-400">{formatFileSize(file.size)}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{dateStr}</p>
        </div>

        {/* Actions on hover */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
            aria-label="View file"
          >
            <Eye size={14} className="text-cyan-400" />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"
              aria-label="Remove file"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Indexed status indicator */}
      {file.searchText && (
        <div className="mt-3 pt-2 border-t border-white/5">
          <p className="text-[10px] text-emerald-400 truncate">
            ✓ Text indexed & searchable
          </p>
        </div>
      )}
    </motion.div>
  )
}
