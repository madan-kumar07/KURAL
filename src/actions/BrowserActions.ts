// BrowserActions.ts — Real browser capability actions
// OPEN_APP, SEARCH_WEB, PLAY_MUSIC, SEND_WHATSAPP, SET_TIMER, OPEN_MAPS, MAKE_CALL

import type {
  OpenAppAction, SearchWebAction, PlayMusicAction,
  SendWhatsAppAction, SetTimerAction, OpenMapsAction, MakeCallAction,
} from '../agent/ActionPlan'
import { activityRepository } from '../data/ActivityRepository'
import { contactRepository } from '../data/ContactRepository'

export interface BrowserActionResult {
  success: boolean
  message: string
  url?: string
  timerLabel?: string
  timerDuration?: number
}

// ─── APP URLS (safe allowlist) ────────────────────────────────────────────────
const APP_URLS: Record<string, string> = {
  youtube:    'https://www.youtube.com',
  whatsapp:   'https://web.whatsapp.com',
  instagram:  'https://www.instagram.com',
  gmail:      'https://mail.google.com',
  google:     'https://www.google.com',
  maps:       'https://maps.google.com',
  spotify:    'https://open.spotify.com',
  gaana:      'https://gaana.com',
  jiosaavn:   'https://www.jiosaavn.com',
  netflix:    'https://www.netflix.com',
  amazon:     'https://www.amazon.in',
  flipkart:   'https://www.flipkart.com',
  twitter:    'https://x.com',
  facebook:   'https://www.facebook.com',
  paytm:      'https://paytm.com',
  phonepe:    'https://www.phonepe.com',
  gpay:       'https://pay.google.com',
  swiggy:     'https://www.swiggy.com',
  zomato:     'https://www.zomato.com',
  ola:        'https://book.olacabs.com',
  uber:       'https://m.uber.com',
  hotstar:    'https://www.hotstar.com',
  jiocinema:  'https://www.jiocinema.com',
  settings:   '',
  camera:     '',
  calculator: '',
}

function safeOpen(url: string): void {
  if (!url) return
  // Security: only allow http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─── OPEN_APP ─────────────────────────────────────────────────────────────────
export async function executeOpenApp(action: OpenAppAction): Promise<BrowserActionResult> {
  const app = action.app.toLowerCase()
  const url = action.url || APP_URLS[app] || ''

  if (url.startsWith('internal:')) {
    const target = url.split(':')[1]
    await activityRepository.add({
      type: 'find_file',
      description: `Navigated to ${target}`,
    })
    return { success: true, message: `Navigating to ${target}…`, url }
  }

  if (!url) {
    await activityRepository.add({ type: 'find_file', description: `Opened system ${action.app}` })
    return { success: true, message: `Opened system ${action.app}` }
  }

  const finalUrl = action.query
    ? `${url}/search?q=${encodeURIComponent(action.query)}`
    : url

  safeOpen(finalUrl)
  await activityRepository.add({
    type: 'find_file',
    description: `Opened ${action.app}`,
    detail: action.query ? `Searched: ${action.query}` : url,
  })

  return { success: true, message: `Opening ${action.app}…`, url: finalUrl }
}

// ─── SEARCH_WEB ───────────────────────────────────────────────────────────────
export async function executeSearchWeb(action: SearchWebAction): Promise<BrowserActionResult> {
  const engines: Record<string, string> = {
    google:  `https://www.google.com/search?q=${encodeURIComponent(action.query)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(action.query)}`,
    bing:    `https://www.bing.com/search?q=${encodeURIComponent(action.query)}`,
    maps:    `https://www.google.com/maps/search/${encodeURIComponent(action.query)}`,
  }
  const url = engines[action.engine || 'google']
  safeOpen(url)
  await activityRepository.add({
    type: 'find_file',
    description: `Searched ${action.engine || 'Google'}: "${action.query}"`,
  })
  return { success: true, message: `Searching ${action.engine || 'Google'} for "${action.query}"…`, url }
}

// ─── PLAY_MUSIC ───────────────────────────────────────────────────────────────
export async function executePlayMusic(action: PlayMusicAction): Promise<BrowserActionResult> {
  const platform = action.platform || 'youtube'
  const urls: Record<string, string> = {
    youtube:  `https://www.youtube.com/results?search_query=${encodeURIComponent(action.query + ' song')}`,
    spotify:  `https://open.spotify.com/search/${encodeURIComponent(action.query)}`,
    gaana:    `https://gaana.com/search/${encodeURIComponent(action.query)}`,
    jiosaavn: `https://www.jiosaavn.com/search/${encodeURIComponent(action.query)}`,
  }
  const url = urls[platform] || urls.youtube
  safeOpen(url)
  await activityRepository.add({
    type: 'find_file',
    description: `Playing music: "${action.query}" on ${platform}`,
  })
  return { success: true, message: `Opening ${platform} for "${action.query}"…`, url }
}

// ─── SEND_WHATSAPP ────────────────────────────────────────────────────────────
export async function executeSendWhatsApp(action: SendWhatsAppAction): Promise<BrowserActionResult> {
  let url = 'https://web.whatsapp.com'
  let targetPhone = action.phone

  if (action.contact && !targetPhone) {
    const found = await contactRepository.findByName(action.contact)
    if (found) targetPhone = found.phone
  }

  if (targetPhone) {
    const phone = targetPhone.replace(/\D/g, '')
    const msg = action.message ? `&text=${encodeURIComponent(action.message)}` : ''
    url = `https://api.whatsapp.com/send?phone=${phone}${msg}`
  } else if (action.message) {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(action.message)}`
  }

  safeOpen(url)
  const desc = action.contact
    ? `Opened WhatsApp for ${action.contact}`
    : 'Opened WhatsApp'
  await activityRepository.add({ type: 'share_file', description: desc, detail: action.message ? `Message: "${action.message}"` : undefined })
  return {
    success: true,
    message: action.contact
      ? `Opening WhatsApp chat with ${action.contact}${action.message ? ` ("${action.message}")` : ''}…`
      : 'Opening WhatsApp…',
    url,
  }
}

// ─── SET_TIMER ────────────────────────────────────────────────────────────────
export async function executeSetTimer(action: SetTimerAction): Promise<BrowserActionResult> {
  // Try native Android intent via URL scheme on mobile
  // Fallback: open Google timer in browser
  const mins = Math.floor(action.duration / 60)
  const secs = action.duration % 60
  let timerUrl = `https://www.google.com/search?q=${encodeURIComponent(`${mins > 0 ? mins + ' minute' : ''}${secs > 0 ? ' ' + secs + ' second' : ''} timer`)}`

  // On Android Chrome, try the intent URL
  const isAndroid = /Android/i.test(navigator.userAgent)
  if (isAndroid) {
    timerUrl = `intent://timer?dur=${action.duration}&title=${encodeURIComponent(action.label || 'KURAL Timer')}#Intent;scheme=android-app;package=com.google.android.deskclock;end`
  }

  safeOpen(timerUrl)
  await activityRepository.add({
    type: 'create_reminder',
    description: `Timer set: ${action.label || `${mins}m ${secs}s`}`,
  })
  return {
    success: true,
    message: `Timer set for ${action.label || `${mins > 0 ? mins + ' min' : ''}${secs > 0 ? ' ' + secs + ' sec' : ''}`}`,
    timerLabel: action.label,
    timerDuration: action.duration,
  }
}

// ─── OPEN_MAPS ────────────────────────────────────────────────────────────────
export async function executeOpenMaps(action: OpenMapsAction): Promise<BrowserActionResult> {
  const q = encodeURIComponent(action.destination)
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad/i.test(navigator.userAgent)

  let url = `https://www.google.com/maps/search/?api=1&query=${q}`
  if (isAndroid) {
    url = `geo:0,0?q=${q}`
  } else if (isIOS) {
    url = `maps://maps.apple.com/?q=${q}`
  }

  safeOpen(url)
  await activityRepository.add({
    type: 'find_file',
    description: `Maps: navigating to "${action.destination}"`,
  })
  return { success: true, message: `Opening Maps for "${action.destination}"…`, url }
}

// ─── MAKE_CALL ────────────────────────────────────────────────────────────────
export async function executeMakeCall(action: MakeCallAction): Promise<BrowserActionResult> {
  if (action.phone) {
    const clean = action.phone.replace(/\D/g, '')
    window.location.href = `tel:${clean}`
    await activityRepository.add({ type: 'find_file', description: `Calling ${action.phone}` })
    return { success: true, message: `Calling ${action.phone}…` }
  }
  if (action.contact) {
    // Open contacts search — on mobile this opens the dialer
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      window.location.href = `intent:#Intent;action=android.intent.action.CALL;end`
    }
    await activityRepository.add({ type: 'find_file', description: `Call requested for ${action.contact}` })
    return {
      success: true,
      message: `To call ${action.contact}, please open your contacts app. Browser security prevents direct contact access.`,
    }
  }
  return { success: false, message: 'No phone number or contact specified.' }
}
