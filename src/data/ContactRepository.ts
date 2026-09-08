// ContactRepository.ts — Contact management and auto-seeding for WhatsApp & Calls
import { getDb } from './indexedDb'
import { nanoid } from '../utils/nanoid'

export interface ContactRecord {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
}

export class ContactRepository {
  async add(entry: Omit<ContactRecord, 'id'>): Promise<ContactRecord> {
    const db = await getDb()
    const record: ContactRecord = {
      id: nanoid(),
      ...entry,
      phone: entry.phone.replace(/\D/g, ''),
    }
    await db.put('contacts', record)
    return record
  }

  async getAll(): Promise<ContactRecord[]> {
    const db = await getDb()
    if (!db.objectStoreNames.contains('contacts')) return []
    return db.getAll('contacts') as Promise<ContactRecord[]>
  }

  async findByName(query: string): Promise<ContactRecord | undefined> {
    const contacts = await this.getAll()
    const q = query.toLowerCase().trim()
    if (!q) return undefined

    // Exact match
    const exact = contacts.find(c => c.name.toLowerCase() === q)
    if (exact) return exact

    // Starts with or includes
    const match = contacts.find(c =>
      c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())
    )
    if (match) return match

    // First name match e.g. "Rajiv" -> "Rajiv Menon"
    const firstNameMatch = contacts.find(c => {
      const parts = c.name.toLowerCase().split(/\s+/)
      return parts.some(p => p === q || q.startsWith(p))
    })
    return firstNameMatch
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    if (db.objectStoreNames.contains('contacts')) {
      await db.delete('contacts', id)
    }
  }

  async count(): Promise<number> {
    const db = await getDb()
    if (!db.objectStoreNames.contains('contacts')) return 0
    return db.count('contacts')
  }

  async clear(): Promise<void> {
    const db = await getDb()
    if (db.objectStoreNames.contains('contacts')) {
      await db.clear('contacts')
    }
  }
}

export const contactRepository = new ContactRepository()
