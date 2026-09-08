// ActionPlan.ts — Strict typed interfaces for the KURAL action plan
// JSON contract between IntentEngine and ActionExecutor

export type ActionType =
  | 'FIND_FILE'
  | 'READ_FILE'
  | 'SHARE_FILE'
  | 'CREATE_REMINDER'
  | 'OPEN_APP'
  | 'SEARCH_WEB'
  | 'PLAY_MUSIC'
  | 'SEND_WHATSAPP'
  | 'SET_TIMER'
  | 'OPEN_MAPS'
  | 'MAKE_CALL'

export interface FindFileAction {
  type: 'FIND_FILE'
  query: string
  folder?: string
  sort?: 'latest' | 'oldest' | 'name'
  limit?: number
  fileType?: string
}

export interface ReadFileAction {
  type: 'READ_FILE'
  source: 'previous_result' | string
  extract?: string[]
  fileId?: string
}

export interface ShareFileAction {
  type: 'SHARE_FILE'
  source: 'previous_result' | string
  contact?: string
  platform?: string
  fileId?: string
}

export interface CreateReminderAction {
  type: 'CREATE_REMINDER'
  title: string
  triggerTime: string
  source?: 'previous_result' | string
  message?: string
  fileId?: string
}

export interface OpenAppAction {
  type: 'OPEN_APP'
  app: string           // 'youtube' | 'whatsapp' | 'instagram' | 'maps' | 'gmail' | 'spotify' | 'chrome' | 'settings'
  url?: string          // fallback URL
  query?: string        // search query if applicable
}

export interface SearchWebAction {
  type: 'SEARCH_WEB'
  query: string
  engine?: 'google' | 'youtube' | 'bing' | 'maps'
}

export interface PlayMusicAction {
  type: 'PLAY_MUSIC'
  query: string         // song/artist/playlist name
  platform?: 'youtube' | 'spotify' | 'gaana' | 'jiosaavn'
}

export interface SendWhatsAppAction {
  type: 'SEND_WHATSAPP'
  contact?: string
  message?: string
  phone?: string
}

export interface SetTimerAction {
  type: 'SET_TIMER'
  duration: number      // seconds
  label?: string
}

export interface OpenMapsAction {
  type: 'OPEN_MAPS'
  destination: string
  mode?: 'driving' | 'walking' | 'transit'
}

export interface MakeCallAction {
  type: 'MAKE_CALL'
  contact?: string
  phone?: string
}

export type Action =
  | FindFileAction
  | ReadFileAction
  | ShareFileAction
  | CreateReminderAction
  | OpenAppAction
  | SearchWebAction
  | PlayMusicAction
  | SendWhatsAppAction
  | SetTimerAction
  | OpenMapsAction
  | MakeCallAction

export interface ActionPlan {
  actions: Action[]
  rawInput?: string
  language?: 'en' | 'ta' | 'tanglish' | 'mixed'
  confidence?: number
}
