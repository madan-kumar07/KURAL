// Files.tsx — Browse, search, and manage locally indexed files

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderOpen, X } from 'lucide-react'

import { FileCard } from '../components/FileCard'
import { FilePicker } from '../components/FilePicker'
import { ConfirmationDialog } from '../components/ConfirmationDialog'

import { fileRepository } from '../data/FileRepository'
import type { FileRecord } from '../data/FileRepository'
import { indexFiles, formatFileSize } from '../files/FileIndexer'
import { readPdfText } from '../files/PdfReader'

type FilterType = 'all' | 'pdf' | 'image' | 'document' | 'other'

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  pdf: 'PDF',
  image: 'Images',
  document: 'Documents',
  other: 'Other',
}

interface FileDetailProps {
  file: FileRecord
  onClose: () => void
  onDelete: () => void
}

function FileDetail({ file, onClose, onDelete }: FileDetailProps) {
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  const handleRead = async () => {
    if (file.type !== 'pdf') {
      setReadError('Text extraction is only available for PDF files.')
      return
    }
    setIsReading(true)
    setReadError(null)
    const result = await readPdfText(file)
    if (result.error && !result.text) {
      setReadError(result.error)
    } else {
      setExtractedText(result.text || 'No text extracted.')
    }
    setIsReading(false)
  }

  const date = new Date(file.modifiedTime).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card-elevated w-full max-w-lg max-h-[80dvh] overflow-auto"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-100 truncate">{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 ml-2 flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Metadata */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Type', value: file.type.toUpperCase() },
              { label: 'Size', value: formatFileSize(file.size) },
              { label: 'MIME', value: file.mimeType },
              { label: 'Indexed', value: new Date(file.lastIndexed).toLocaleDateString('en-IN') },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card-blue p-3 rounded-xl">
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-xs font-medium text-cyan-300 truncate mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Image preview */}
          {file.type === 'image' && file.dataUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={file.dataUrl}
                alt={file.name}
                className="w-full object-contain max-h-48"
              />
            </div>
          )}

          {/* PDF text extraction */}
          {file.type === 'pdf' && (
            <div>
              {!extractedText && !readError && (
                <button
                  onClick={handleRead}
                  disabled={isReading}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  {isReading ? 'Extracting text…' : 'Extract PDF text'}
                </button>
              )}
              {readError && (
                <p className="text-xs text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  {readError}
                </p>
              )}
              {extractedText && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-300 mb-2">Extracted text (preview):</p>
                  <pre className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed border border-white/10">
                    {extractedText.substring(0, 800)}
                    {extractedText.length > 800 ? '…' : ''}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Cached search text */}
          {file.searchText && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium">✓ Text indexed & searchable</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onDelete} className="btn-ghost text-red-400 hover:bg-red-500/10">
            Remove
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Files() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexMessage, setIndexMessage] = useState('')

  const loadFiles = useCallback(async () => {
    const all = await fileRepository.getAll()
    setFiles(all.sort((a, b) => b.modifiedTime - a.modifiedTime))
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const filtered = files.filter(f => {
    const matchQuery = !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.searchText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchType = activeFilter === 'all' || f.type === activeFilter
    return matchQuery && matchType
  })

  const handleFilesAdded = async (newFiles: File[]) => {
    setIsIndexing(true)
    setIndexMessage(`Indexing ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}…`)
    try {
      await indexFiles(newFiles)
      await loadFiles()
      setIndexMessage(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added.`)
      setTimeout(() => setIndexMessage(''), 3000)
    } catch {
      setIndexMessage('Failed to index some files.')
    } finally {
      setIsIndexing(false)
    }
  }

  const handleDelete = async (file: FileRecord) => {
    await fileRepository.delete(file.id)
    await loadFiles()
    setDeleteTarget(null)
    if (selectedFile?.id === file.id) setSelectedFile(null)
  }

  return (
    <div className="page-container">
      <div className="max-w-lg mx-auto px-4 pt-2 pb-4 space-y-4">

        {/* ── Search bar ─── */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indexed files…"
            className="kural-input pl-10"
            aria-label="Search files"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Clear search"
            >
              <X size={13} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* ── Filter chips ─── */}
        <div className="chips-scroll">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="suggestion-chip"
              style={{
                background: activeFilter === f ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: activeFilter === f ? '#38bdf8' : '#94a3b8',
                borderColor: activeFilter === f ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
          <div className="flex-shrink-0 ml-auto">
            <FilePicker onFiles={handleFilesAdded} disabled={isIndexing} />
          </div>
        </div>

        {/* ── Index message ─── */}
        <AnimatePresence>
          {indexMessage && (
            <motion.p
              className="text-xs text-cyan-400 font-medium px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {indexMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Files list ─── */}
        {filtered.length === 0 ? (
          <motion.div
            className="glass-card p-8 flex flex-col items-center gap-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400">
              <FolderOpen size={28} strokeWidth={1.5} />
            </div>
            {searchQuery || activeFilter !== 'all' ? (
              <>
                <p className="text-sm font-semibold text-slate-100">No files match your search</p>
                <p className="text-xs text-slate-400">
                  Try a different search term or filter.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveFilter('all') }}
                  className="btn-secondary"
                >
                  <X size={14} /> Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-100">No files indexed yet</p>
                <p className="text-xs text-slate-400">
                  Add files so KURAL can find, read, and share them.
                </p>
                <FilePicker onFiles={handleFilesAdded} variant="drop-zone" />
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 px-1">
              {filtered.length} file{filtered.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
            <AnimatePresence>
              {filtered.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => setSelectedFile(file)}
                  onDelete={() => setDeleteTarget(file)}
                  isSelected={selectedFile?.id === file.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Drop zone if has files ─── */}
        {filtered.length > 0 && (
          <FilePicker onFiles={handleFilesAdded} variant="drop-zone" disabled={isIndexing} />
        )}
      </div>

      {/* ── File detail modal ─── */}
      <AnimatePresence>
        {selectedFile && (
          <FileDetail
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onDelete={() => setDeleteTarget(selectedFile)}
          />
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ─── */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Remove file?"
        message={`Remove "${deleteTarget?.name}" from KURAL? The original file on your device will not be deleted.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
