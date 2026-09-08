// indexedDb.ts — IndexedDB setup using the 'idb' library
// Single source of truth for database schema and versioning

import { openDB, type IDBPDatabase } from 'idb'

export const DB_NAME = 'kural-v2'
export const DB_VERSION = 1

export interface FileRecord {
  id: string
  name: string
  type: string        // 'pdf' | 'image' | 'document' | 'other'
  mimeType: string
  size: number        // bytes
  folder?: string
  modifiedTime: number // Unix ms
  lastIndexed: number  // Unix ms
  searchText?: string  // extracted/OCR text for search
  source: 'user-added' | 'sample'
  dataUrl?: string
}

export interface ActivityRecord {
  id: string
  timestamp: number
  type: 'find_file' | 'read_file' | 'share_file' | 'create_reminder' | 'error'
  description: string
  detail?: string
  fileId?: string
  fileName?: string
}

export interface ReminderRecord {
  id: string
  title: string
  message?: string
  triggerTime: number // Unix ms
  createdAt: number
  fileId?: string
  fileName?: string
  fired: boolean
}

export interface ContactRecord {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
}

let _db: IDBPDatabase | null = null

export async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db

  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Files store
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' })
        fileStore.createIndex('by-name', 'name', { unique: false })
        fileStore.createIndex('by-type', 'type', { unique: false })
        fileStore.createIndex('by-modified', 'modifiedTime', { unique: false })
        fileStore.createIndex('by-folder', 'folder', { unique: false })
      }

      // Activity store
      if (!db.objectStoreNames.contains('activity')) {
        const actStore = db.createObjectStore('activity', { keyPath: 'id' })
        actStore.createIndex('by-time', 'timestamp', { unique: false })
      }

      // Reminders store
      if (!db.objectStoreNames.contains('reminders')) {
        const remStore = db.createObjectStore('reminders', { keyPath: 'id' })
        remStore.createIndex('by-trigger', 'triggerTime', { unique: false })
      }

      // Contacts store
      if (!db.objectStoreNames.contains('contacts')) {
        const conStore = db.createObjectStore('contacts', { keyPath: 'id' })
        conStore.createIndex('by-name', 'name', { unique: false })
      }
    },
  })

  return _db
}

export async function clearAllData(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['files', 'activity', 'reminders', 'contacts'], 'readwrite')
  await Promise.all([
    tx.objectStore('files').clear(),
    tx.objectStore('activity').clear(),
    tx.objectStore('reminders').clear(),
    tx.objectStore('contacts').clear(),
  ])
  await tx.done
}
