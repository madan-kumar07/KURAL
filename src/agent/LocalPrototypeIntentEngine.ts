// LocalPrototypeIntentEngine.ts — Full multilingual intent engine
// Handles files, web search, music, apps, WhatsApp, timers, maps, calls

import type { IntentEngine } from './IntentEngine'
import type { ActionPlan, Action } from './ActionPlan'
import { LanguageNormalizer } from '../voice/LanguageNormalizer'
import { queryGeminiIntent } from './GeminiLLMService'

const normalizer = new LanguageNormalizer()

// ─── Time parsing ────────────────────────────────────────────────────────────

function parseRelativeTime(text: string): string | null {
  const now = new Date()
  const t = text.toLowerCase()

  const tomorrowMatch = t.match(/tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (tomorrowMatch) {
    const d = new Date(now); d.setDate(d.getDate() + 1)
    let h = parseInt(tomorrowMatch[1]); const m = parseInt(tomorrowMatch[2] || '0')
    const mer = tomorrowMatch[3]?.toLowerCase()
    if (mer === 'pm' && h < 12) h += 12; if (mer === 'am' && h === 12) h = 0
    d.setHours(h, m, 0, 0); return d.toISOString()
  }
  const inMatch = t.match(/in\s+(\d+)\s+(hour|minute|min|hr)/i)
  if (inMatch) {
    const amt = parseInt(inMatch[1]); const unit = inMatch[2].toLowerCase()
    const d = new Date(now)
    if (unit.startsWith('hour') || unit.startsWith('hr')) d.setHours(d.getHours() + amt)
    else d.setMinutes(d.getMinutes() + amt)
    return d.toISOString()
  }
  const todayMatch = t.match(/today\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (todayMatch) {
    const d = new Date(now); let h = parseInt(todayMatch[1]); const m = parseInt(todayMatch[2] || '0')
    const mer = todayMatch[3]?.toLowerCase()
    if (mer === 'pm' && h < 12) h += 12; if (mer === 'am' && h === 12) h = 0
    d.setHours(h, m, 0, 0); return d.toISOString()
  }
  const timeOnly = t.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (timeOnly) {
    const d = new Date(now); let h = parseInt(timeOnly[1]); const m = parseInt(timeOnly[2] || '0')
    const mer = timeOnly[3].toLowerCase()
    if (mer === 'pm' && h < 12) h += 12; if (mer === 'am' && h === 12) h = 0
    d.setHours(h, m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1)
    return d.toISOString()
  }
  if (/n[ae]l[ae]ikku/i.test(t) || /naalai/i.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0)
    return d.toISOString()
  }
  return null
}

// ─── Duration parsing for timers ─────────────────────────────────────────────

function parseDuration(text: string): number | null {
  const t = text.toLowerCase()
  let secs = 0
  const hrMatch  = t.match(/(\d+)\s*(?:hour|hr|மணி)/i)
  const minMatch = t.match(/(\d+)\s*(?:minute|min|நிமிட)/i)
  const secMatch = t.match(/(\d+)\s*(?:second|sec|வினாடி)/i)
  if (hrMatch)  secs += parseInt(hrMatch[1]) * 3600
  if (minMatch) secs += parseInt(minMatch[1]) * 60
  if (secMatch) secs += parseInt(secMatch[1])
  return secs > 0 ? secs : null
}

// ─── App name resolver ───────────────────────────────────────────────────────

const APP_MAP: Record<string, { app: string; url: string }> = {
  youtube:   { app: 'youtube',   url: 'https://www.youtube.com' },
  yt:        { app: 'youtube',   url: 'https://www.youtube.com' },
  whatsapp:  { app: 'whatsapp',  url: 'https://web.whatsapp.com' },
  wa:        { app: 'whatsapp',  url: 'https://web.whatsapp.com' },
  instagram: { app: 'instagram', url: 'https://www.instagram.com' },
  insta:     { app: 'instagram', url: 'https://www.instagram.com' },
  gmail:     { app: 'gmail',     url: 'https://mail.google.com' },
  google:    { app: 'google',    url: 'https://www.google.com' },
  maps:      { app: 'maps',      url: 'https://maps.google.com' },
  spotify:   { app: 'spotify',   url: 'https://open.spotify.com' },
  gaana:     { app: 'gaana',     url: 'https://gaana.com' },
  jiosaavn:  { app: 'jiosaavn',  url: 'https://www.jiosaavn.com' },
  netflix:   { app: 'netflix',   url: 'https://www.netflix.com' },
  amazon:    { app: 'amazon',    url: 'https://www.amazon.in' },
  flipkart:  { app: 'flipkart',  url: 'https://www.flipkart.com' },
  twitter:   { app: 'twitter',   url: 'https://twitter.com' },
  x:         { app: 'twitter',   url: 'https://x.com' },
  facebook:  { app: 'facebook',  url: 'https://www.facebook.com' },
  fb:        { app: 'facebook',  url: 'https://www.facebook.com' },
  chrome:    { app: 'chrome',    url: 'https://www.google.com' },
  settings:  { app: 'settings',  url: 'internal:settings' },
  files:     { app: 'files',     url: 'internal:files' },
  documents: { app: 'files',     url: 'internal:files' },
  activity:  { app: 'activity',  url: 'internal:activity' },
  history:   { app: 'activity',  url: 'internal:activity' },
  reminders: { app: 'activity',  url: 'internal:activity' },
  home:      { app: 'home',      url: 'internal:home' },
  camera:    { app: 'camera',    url: '' },
  calculator:{ app: 'calculator',url: '' },
  paytm:     { app: 'paytm',     url: 'https://paytm.com' },
  phonepe:   { app: 'phonepe',   url: 'https://www.phonepe.com' },
  gpay:      { app: 'gpay',      url: 'https://pay.google.com' },
  swiggy:    { app: 'swiggy',    url: 'https://www.swiggy.com' },
  zomato:    { app: 'zomato',    url: 'https://www.zomato.com' },
  ola:       { app: 'ola',       url: 'https://book.olacabs.com' },
  uber:      { app: 'uber',      url: 'https://m.uber.com' },
  hotstar:   { app: 'hotstar',   url: 'https://www.hotstar.com' },
  jiocinema: { app: 'jiocinema', url: 'https://www.jiocinema.com' },
}

function detectApp(text: string): { app: string; url: string } | null {
  const lower = text.toLowerCase()
  for (const [key, val] of Object.entries(APP_MAP)) {
    const re = new RegExp(`\\b${key}\\b`, 'i')
    if (re.test(lower)) return val
  }
  return null
}

// ─── Intent detectors ────────────────────────────────────────────────────────

const findIntent      = (n: string) => /\b(find|search for file|locate|get file|show file|kandupidi|kandu pidichu|தேடு|கண்டுபிடி|engae|engey)\b/i.test(n)
const readIntent      = (n: string) => /\b(read|tell me amount|extract|padichu|படி|sollu the amount|sollu)\b/i.test(n)
const shareIntent     = (n: string) => /\b(share|send file|forward file|anuppu file|அனுப்பு)\b/i.test(n) && !openIntent(n)
const reminderIntent  = (n: string) => /\b(remind|reminder|nyabagam|நினைவூட்டு|alert me|notify me)\b/i.test(n)
const openIntent      = (n: string) => /\b(open|launch|start|go to|take me to|திற|திறக்க|open பண்ண|thora|thira)\b/i.test(n)
const searchIntent    = (n: string) => /\b(search|google|look up|find online|தேடு online|web search)\b/.test(n) && !findIntent(n)
const musicIntent     = (n: string) => /\b(play|song|music|paadu|பாட்டு|பாடல்|paattu|listen|hear)\b/.test(n)
const whatsappIntent  = (n: string) => /\b(whatsapp|message to|text to|send message|send to|msg|wa)\b/.test(n)
const timerIntent     = (n: string) => /\b(timer|set timer|start timer|alarm|count down|நேரம்|டைமர்)\b/.test(n) && !reminderIntent(n)
const mapsIntent      = (n: string) => /\b(navigate|direction|route|how to go|location|where is|maps|வழி|navigate to)\b/.test(n)
const callIntent      = (n: string) => /\b(call|phone|dial|ring|அழைக்க|call pannunga)\b/.test(n)

function extractFileQuery(n: string): string {
  let q = n
    .replace(/\b(find|search|locate|get|show|read|tell me|extract|share|send|forward|remind|reminder|alert|notify|my|the|a|an|and|then|also|please|pannu|panni|la|le|il|ல|என்|ஐ|ஒரு|file|latest|recent|newest|last|oldest|first|new|old|in|from|at|on|to|with|for|about|of|by|into|download|downloads|document|documents|folder|pdf|doc|amount|sollu|padichu)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim()
  return q.length < 2 ? 'file' : q
}

function extractWhatsAppDetails(n: string, original: string): { contact?: string; message?: string } {
  let contact: string | undefined
  let message: string | undefined

  // Pattern 1: "send <message> to <contact>" e.g. "send hi to rajiv menon" or "send happy birthday to rajiv menon on whatsapp"
  const p1 = original.match(/(?:send|text|msg|whatsapp)\s+(.+?)\s+to\s+([A-Za-z\s]{2,30}?)(?:\s+on|\s+in|\s+via|\s+whatsapp|$)/i)
  if (p1) {
    message = p1[1].replace(/^(a\s+)?(message|text|msg)\s+/i, '').trim()
    contact = p1[2].trim()
    return { contact, message }
  }

  // Pattern 2: "send message to <contact> saying <message>" or "send to <contact> <message>"
  const p2 = original.match(/(?:send|text|msg|whatsapp)\s+(?:message\s+)?to\s+([A-Za-z\s]{2,30}?)(?:\s+saying|\s+with|\s+message)?\s+(.+)$/i)
  if (p2) {
    contact = p2[1].trim()
    message = p2[2].trim()
    return { contact, message }
  }

  // Pattern 3: "whatsapp <contact> <message>" or "text <contact> <message>"
  const p3 = original.match(/(?:whatsapp|text|msg)\s+([A-Za-z\s]{2,30}?)\s+(.+)$/i)
  if (p3) {
    contact = p3[1].trim()
    message = p3[2].trim()
    return { contact, message }
  }

  // Pattern 4: "<contact>-ku <message> anuppu" / "<contact> message hi" (Tanglish)
  const p4 = original.match(/([A-Za-z\s]{2,30}?)(?:-?ku|-?kku)?\s+(.+?)\s*(?:anuppu|send|whatsapp|msg)$/i)
  if (p4) {
    contact = p4[1].trim()
    message = p4[2].trim()
    return { contact, message }
  }

  const cMatch = original.match(/(?:to|with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  if (cMatch) contact = cMatch[1]

  return { contact, message }
}

function extractContactName(n: string): string | undefined {
  const m1 = n.match(/(?:to|with|for|send to|message to|whatsapp to)\s+([A-Za-z\s]{2,30})/i)
  if (m1) return m1[1].trim()
  const m2 = n.match(/([A-Za-z\s]{2,30})(?:-?ku|-?kku)?\s+(?:share|anuppu|send|message|call|phone)/i)
  if (m2) return m2[1].trim()
  return undefined
}

function extractSearchQuery(n: string, original: string): string {
  // Remove intent verbs
  let q = n
    .replace(/\b(search|google|look up|find online|web search|for|me|please|kurai|pannu|panni)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim()
  return q.length > 2 ? q : original.replace(/^(search|google|find)\s+/i, '').trim()
}

function extractMusicQuery(n: string, original: string): string {
  let q = n
    .replace(/\b(play|song|music|paadu|listen|hear|on|youtube|spotify|gaana|for|me|please)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim()
  return q.length > 2 ? q : original.replace(/^(play|listen to)\s+/i, '').trim()
}

function extractDestination(n: string): string {
  const m = n.match(/(?:navigate to|directions to|go to|how to go to|route to|maps to|open maps for)\s+(.+)/i)
  if (m) return m[1].trim()
  const m2 = n.match(/(?:navigate|direction|route)\s+(.+)/i)
  return m2 ? m2[1].trim() : n.replace(/\b(navigate|direction|route|maps|where is|location of)\b/gi, '').trim()
}

function extractWhatsAppMessage(n: string): string {
  const m = n.match(/(?:say|message|tell|write|send message)\s+[""']?(.+?)[""']?\s*(?:to|for|$)/i)
  if (m) return m[1].trim()
  return ''
}

function extractReminderTitle(n: string, fileQuery: string): string {
  const m = n.match(/remind\s+(?:me\s+)?(?:to\s+)(.{3,40}?)(?:\s+at|\s+tomorrow|$)/i)
  if (m) return m[1].trim().replace(/^[a-z]/, c => c.toUpperCase())
  if (fileQuery && fileQuery !== 'file') return `Pay ${fileQuery}`
  return 'Reminder'
}

function extractSortOrder(n: string): 'latest' | 'oldest' | 'name' {
  if (/\b(latest|recent|newest|last|new)\b/.test(n)) return 'latest'
  if (/\b(oldest|first|old)\b/.test(n)) return 'oldest'
  return 'latest'
}

function extractMusicPlatform(n: string): 'youtube' | 'spotify' | 'gaana' | 'jiosaavn' {
  if (/spotify/i.test(n)) return 'spotify'
  if (/gaana/i.test(n)) return 'gaana'
  if (/jiosaavn|saavn/i.test(n)) return 'jiosaavn'
  return 'youtube'
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export class LocalPrototypeIntentEngine implements IntentEngine {
  async understand(input: string, _language?: string): Promise<ActionPlan> {
    const { normalized, detectedLanguage } = normalizer.normalize(input)
    const n = normalized.toLowerCase()
    const original = input.trim()

    // ── Primary: Gemini LLM Engine ─────────────────────────────────────────────
    const geminiResult = await queryGeminiIntent(original)
    if (geminiResult && geminiResult.actions?.length > 0 && geminiResult.confidence > 0.5) {
      return {
        actions: geminiResult.actions as Action[],
        rawInput: original,
        language: detectedLanguage as ActionPlan['language'],
        confidence: geminiResult.confidence,
      }
    }

    // ── Fallback: Local Regex Engine ─────────────────────────────────────────
    const actions: Action[] = []

    // ── TIMER ─────────────────────────────────────────────────────────────────
    if (timerIntent(n)) {
      const duration = parseDuration(n)
      if (duration) {
        const mins = Math.floor(duration / 60); const secs = duration % 60
        actions.push({
          type: 'SET_TIMER',
          duration,
          label: mins > 0
            ? `${mins} minute${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs}s` : ''} timer`
            : `${secs} second timer`,
        })
        return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.92 }
      }
    }

    // ── CALL ──────────────────────────────────────────────────────────────────
    if (callIntent(n)) {
      const contact = extractContactName(n)
      actions.push({ type: 'MAKE_CALL', contact })
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.88 }
    }

    // ── MAPS ──────────────────────────────────────────────────────────────────
    if (mapsIntent(n)) {
      const destination = extractDestination(n)
      actions.push({ type: 'OPEN_MAPS', destination })
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.88 }
    }

    // ── WHATSAPP (send message) ───────────────────────────────────────────────
    if (whatsappIntent(n) && !openIntent(n)) {
      const { contact, message } = extractWhatsAppDetails(n, original)
      actions.push({ type: 'SEND_WHATSAPP', contact, message: message || 'hi' })
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.92 }
    }

    // ── MUSIC ─────────────────────────────────────────────────────────────────
    if (musicIntent(n)) {
      const query = extractMusicQuery(n, original)
      const platform = extractMusicPlatform(n)
      actions.push({ type: 'PLAY_MUSIC', query, platform })
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.92 }
    }

    // ── OPEN APP ──────────────────────────────────────────────────────────────
    if (openIntent(n)) {
      const appInfo = detectApp(n)
      if (appInfo) {
        // Check if there's also a search query
        const queryMatch = n.match(/(?:and\s+(?:search|play|find|look|show))?\s+(.{3,50})\s*(?:on|in)?\s*\w*$/)
        if (queryMatch && queryMatch[1].length > 2) {
          // e.g. "open YouTube and play Deva songs"
          if (musicIntent(n) && appInfo.app === 'youtube') {
            const q = extractMusicQuery(n, original)
            actions.push({ type: 'PLAY_MUSIC', query: q, platform: 'youtube' })
          } else {
            actions.push({ type: 'OPEN_APP', app: appInfo.app, url: appInfo.url, query: queryMatch[1] })
          }
        } else {
          actions.push({ type: 'OPEN_APP', app: appInfo.app, url: appInfo.url })
        }
        return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.92 }
      }
    }

    // ── OPEN APP (no explicit "open" verb, just app name) ────────────────────
    const implicitApp = detectApp(n)
    if (implicitApp && !findIntent(n) && !readIntent(n) && !shareIntent(n) && !reminderIntent(n)) {
      // e.g. "YouTube" or "WhatsApp la message"
      if (musicIntent(n) && implicitApp.app === 'youtube') {
        const q = extractMusicQuery(n, original)
        actions.push({ type: 'PLAY_MUSIC', query: q, platform: 'youtube' })
      } else if (whatsappIntent(n)) {
        const contact = extractContactName(n)
        const message = extractWhatsAppMessage(n)
        actions.push({ type: 'SEND_WHATSAPP', contact, message })
      } else {
        actions.push({ type: 'OPEN_APP', app: implicitApp.app, url: implicitApp.url })
      }
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.85 }
    }

    // ── WEB SEARCH ────────────────────────────────────────────────────────────
    if (searchIntent(n)) {
      const query = extractSearchQuery(n, original)
      const engine: 'google' | 'youtube' = musicIntent(n) ? 'youtube' : 'google'
      actions.push({ type: 'SEARCH_WEB', query, engine })
      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.85 }
    }

    // ── FILE OPERATIONS ───────────────────────────────────────────────────────
    const isFileQuery = findIntent(n) || readIntent(n) || shareIntent(n) || reminderIntent(n) ||
                        openIntent(n) || /\b(file|files|document|documents|invoice|bill|pdf|receipt|report)\b/i.test(n)

    if (isFileQuery) {
      const query   = extractFileQuery(n)
      const sort    = extractSortOrder(n)
      const fileType = /\bpdf\b/.test(n) ? 'pdf' : /\b(image|photo|jpg)\b/.test(n) ? 'image' : undefined

      actions.push({ type: 'FIND_FILE', query, sort, limit: 1, ...(fileType ? { fileType } : {}) })

      if (readIntent(n) || openIntent(n)) {
        const fields: string[] = []
        if (/amount|price|total|sum|₹|\$|rs/i.test(n)) fields.push('amount')
        if (/date|when/i.test(n)) fields.push('date')
        if (fields.length === 0) fields.push('amount', 'date')
        actions.push({ type: 'READ_FILE', source: 'previous_result', extract: fields })
      }

      if (shareIntent(n)) {
        const contact = extractContactName(n)
        actions.push({ type: 'SHARE_FILE', source: 'previous_result', ...(contact ? { contact } : {}) })
      }

      if (reminderIntent(n)) {
        const triggerTime = parseRelativeTime(n) ?? (() => {
          const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString()
        })()
        const title = extractReminderTitle(n, query)
        actions.push({ type: 'CREATE_REMINDER', title, triggerTime, source: 'previous_result', message: `KURAL: ${title}` })
      }

      return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.78 }
    }

    // ── Fallback: try web search ───────────────────────────────────────────────
    const fallbackQuery = original.trim()
    if (fallbackQuery) {
      actions.push({ type: 'SEARCH_WEB', query: fallbackQuery, engine: 'google' })
    }

    return { actions, rawInput: original, language: detectedLanguage as ActionPlan['language'], confidence: 0.50 }
  }
}
