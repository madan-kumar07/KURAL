// ActivityRepository.ts — CRUD for activity records

export type { ActivityRecord } from './indexedDb'
import { getDb, type ActivityRecord } from './indexedDb'
import { nanoid } from '../utils/nanoid'

export class ActivityRepository {
  async add(entry: Omit<ActivityRecord, 'id' | 'timestamp'>): Promise<ActivityRecord> {
    const db = await getDb()
    const record: ActivityRecord = {
      id: nanoid(),
      timestamp: Date.now(),
      ...entry,
    }
    await db.add('activity', record)
    return record
  }

  async getAll(): Promise<ActivityRecord[]> {
    const db = await getDb()
    const all = await db.getAll('activity') as ActivityRecord[]
    return all.sort((a, b) => b.timestamp - a.timestamp)
  }

  async getRecent(limit = 20): Promise<ActivityRecord[]> {
    const all = await this.getAll()
    return all.slice(0, limit)
  }

  async clear(): Promise<void> {
    const db = await getDb()
    await db.clear('activity')
  }

  async count(): Promise<number> {
    const db = await getDb()
    return db.count('activity')
  }
}

export const activityRepository = new ActivityRepository()
