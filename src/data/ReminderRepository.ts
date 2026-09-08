// ReminderRepository.ts — CRUD for reminder records

export type { ReminderRecord } from './indexedDb'
import { getDb, type ReminderRecord } from './indexedDb'
import { nanoid } from '../utils/nanoid'

export class ReminderRepository {
  async add(entry: Omit<ReminderRecord, 'id' | 'createdAt' | 'fired'>): Promise<ReminderRecord> {
    const db = await getDb()
    const record: ReminderRecord = {
      id: nanoid(),
      createdAt: Date.now(),
      fired: false,
      ...entry,
    }
    await db.add('reminders', record)
    return record
  }

  async getAll(): Promise<ReminderRecord[]> {
    const db = await getDb()
    const all = await db.getAll('reminders') as ReminderRecord[]
    return all.sort((a, b) => a.triggerTime - b.triggerTime)
  }

  async getPending(): Promise<ReminderRecord[]> {
    const all = await this.getAll()
    return all.filter(r => !r.fired && r.triggerTime > Date.now())
  }

  async markFired(id: string): Promise<void> {
    const db = await getDb()
    const r = await db.get('reminders', id) as ReminderRecord | undefined
    if (r) {
      r.fired = true
      await db.put('reminders', r)
    }
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('reminders', id)
  }

  async count(): Promise<number> {
    const db = await getDb()
    return db.count('reminders')
  }

  async clear(): Promise<void> {
    const db = await getDb()
    await db.clear('reminders')
  }
}

export const reminderRepository = new ReminderRepository()
