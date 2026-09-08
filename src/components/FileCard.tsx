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
  const size = 22
  if (type === 'pdf' || mimeType.includes('pdf')) {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center file-icon-pdf">
        <FileType size={size} strokeWidth={1.8} />
      </div>
    )
  }
  if (type === 'image') {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center file-icon-img">
        <Image size={size} strokeWidth={1.8} />
      </div>
    )
  }
  if (type === 'document') {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center file-icon-doc">
        <FileText size={size} strokeWidth={1.8} />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center file-icon-default">
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
          ? '1.5px solid rgba(0,136,255,0.40)'
          : '1px solid rgba(255,255,255,0.50)',
        boxShadow: isSelected
          ? '0 4px 24px rgba(0,136,255,0.15)'
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
          <p className="text-sm font-semibold text-ink truncate leading-snug">{file.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="kural-badge">{file.type.toUpperCase()}</span>
            <span className="text-xs text-ink-tertiary">{formatFileSize(file.size)}</span>
          </div>
          <p className="text-xs text-ink-tertiary mt-1">{dateStr}</p>
        </div>

        {/* Actions on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5"
            aria-label="View file"
          >
            <Eye size={14} color="rgba(0,136,255,0.7)" />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
              aria-label="Remove file"
            >
              <Trash2 size={14} color="rgba(220,38,38,0.7)" />
            </button>
          )}
        </div>
      </div>

      {/* Indexed status indicator */}
      {file.searchText && (
        <div className="mt-3 pt-2.5 border-t border-black/5">
          <p className="text-xs text-ink-tertiary truncate">
            Text indexed · searchable
          </p>
        </div>
      )}
    </motion.div>
  )
}
