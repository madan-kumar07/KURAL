// FileRepository.ts — CRUD for file records in IndexedDB with auto-seeding & smart query matching
// Re-exports FileRecord so other modules import from here

export type { FileRecord } from './indexedDb'
import { getDb, type FileRecord } from './indexedDb'

export class FileRepository {
  async add(record: FileRecord): Promise<void> {
    const db = await getDb()
    await db.put('files', record)
  }

  async getById(id: string): Promise<FileRecord | undefined> {
    const db = await getDb()
    return db.get('files', id) as Promise<FileRecord | undefined>
  }

  async getAll(): Promise<FileRecord[]> {
    const db = await getDb()
    return db.getAll('files') as Promise<FileRecord[]>
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('files', id)
  }

  async count(): Promise<number> {
    const db = await getDb()
    return db.count('files')
  }

  async search(query: string, options?: {
    type?: string
    folder?: string
    sort?: 'latest' | 'oldest' | 'name'
    limit?: number
  }): Promise<FileRecord[]> {
    const db = await getDb()
    const allFiles = await db.getAll('files') as FileRecord[]

    const q = query.toLowerCase().trim()
    const genericTerms = ['file', 'files', 'document', 'documents', 'recent', 'latest', 'item', 'items', 'all', '']
    const isGeneric = genericTerms.includes(q)

    let results = allFiles.filter(f => {
      const nameMatch = isGeneric || f.name.toLowerCase().includes(q)
      const typeMatch = !options?.type || f.type === options.type || f.mimeType.includes(options.type!)
      const folderMatch = !options?.folder ||
        (f.folder?.toLowerCase().includes(options.folder.toLowerCase()) ?? false)
      const textMatch = q.length > 2 && !isGeneric && (f.searchText?.toLowerCase().includes(q) ?? false)
      return (nameMatch || textMatch) && typeMatch && folderMatch
    })

    // Sort
    const sort = options?.sort ?? 'latest'
    if (sort === 'latest') {
      results.sort((a, b) => b.modifiedTime - a.modifiedTime)
    } else if (sort === 'oldest') {
      results.sort((a, b) => a.modifiedTime - b.modifiedTime)
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name))
    }

    // Limit
    if (options?.limit && options.limit > 0) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  async updateSearchText(id: string, searchText: string): Promise<void> {
    const db = await getDb()
    const file = await db.get('files', id) as FileRecord | undefined
    if (file) {
      file.searchText = searchText
      await db.put('files', file)
    }
  }

  async clear(): Promise<void> {
    const db = await getDb()
    await db.clear('files')
  }
}

export const fileRepository = new FileRepository()
