// SpeechEngine.ts — Web Speech API with smart browser error handling
/* eslint-disable @typescript-eslint/no-explicit-any */

export type SpeechState =
  | 'idle' | 'requesting_permission' | 'listening'
  | 'transcribing' | 'done' | 'error' | 'unsupported'

export interface SpeechResult {
  transcript: string
  isFinal: boolean
  confidence: number
}

export interface SpeechEngineConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onInterim?: (transcript: string) => void
  onFinal?: (result: SpeechResult) => void
  onStateChange?: (state: SpeechState) => void
  onError?: (error: string, code?: string) => void
}

// Detect browser for user-friendly error messages
function getBrowserName(): string {
  const ua = navigator.userAgent
  if (/Brave/i.test(ua) || (navigator as any).brave) return 'Brave'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Chrome/i.test(ua)) return 'Chrome'
  if (/Safari/i.test(ua)) return 'Safari'
  return 'this browser'
}

function isLocalhost(): boolean {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
}

function isBrave(): boolean {
  return !!(navigator as any).brave || /Brave/i.test(navigator.userAgent)
}

export class SpeechEngine {
  private recognition: any = null
  private config: SpeechEngineConfig
  private state: SpeechState = 'idle'
  private _isSupported: boolean

  constructor(config: SpeechEngineConfig = {}) {
    this.config = config
    this._isSupported = this.checkSupport()
    if (!this._isSupported) this.setState('unsupported')
  }

  get isSupported(): boolean { return this._isSupported }
  get currentState(): SpeechState { return this.state }

  private checkSupport(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  private setState(s: SpeechState): void {
    this.state = s
    this.config.onStateChange?.(s)
  }

  async start(): Promise<void> {
    if (!this._isSupported) {
      this.config.onError?.(
        'Voice recognition is not supported in this browser. Use Chrome or Edge for voice input.',
        'unsupported'
      )
      return
    }

    if (this.state === 'listening') { this.stop(); return }

    // Brave-specific: warn about network speech issues
    if (isBrave() && isLocalhost()) {
      this.config.onError?.(
        'Brave Browser blocks speech recognition on localhost. Please:\n1. Deploy to HTTPS (Vercel) for full voice support, OR\n2. Use the text input below — all features work with text!',
        'brave_localhost'
      )
      return
    }

    // Permission check
    try {
      this.setState('requesting_permission')
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err: any) {
      this.setState('error')
      this.config.onError?.(
        err?.name === 'NotAllowedError'
          ? 'Microphone access denied. Click the lock icon in your browser address bar to allow microphone access.'
          : 'Microphone is unavailable. Check your device settings.',
        'mic_denied'
      )
      return
    }

    const w = window as any
    const SRClass = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SRClass) {
      this.setState('unsupported')
      this.config.onError?.('Speech recognition unavailable.', 'unsupported')
      return
    }

    this.recognition = new SRClass()
    const r = this.recognition

    r.lang           = this.config.language || 'en-IN'
    r.continuous     = this.config.continuous ?? false
    r.interimResults = this.config.interimResults ?? true
    r.maxAlternatives = 1

    r.onstart     = () => this.setState('listening')
    r.onspeechend = () => this.setState('transcribing')

    r.onresult = (event: any) => {
      let interim = '', final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      if (interim) this.config.onInterim?.(interim)
      if (final) {
        this.setState('done')
        this.config.onFinal?.({
          transcript: final, isFinal: true,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.85,
        })
      }
    }

    r.onnomatch = () => {
      this.setState('error')
      this.config.onError?.("I didn't catch that. Please try again or type instead.", 'no_match')
    }

    r.onerror = (event: any) => {
      this.setState('error')
      const browser = getBrowserName()
      const messages: Record<string, string> = {
        'no-speech':   'No speech detected. Please speak clearly and try again.',
        'audio-capture': 'Microphone unavailable.',
        'not-allowed': 'Microphone access denied. Allow microphone in browser settings.',
        'network':     isBrave()
          ? `Brave Browser blocks Google's speech service. Deploy to HTTPS or use text input.`
          : `Network error. Ensure internet is connected and retry.`,
        'aborted':     'Listening stopped.',
        'language-not-supported': `Language not supported for voice in ${browser}. Try "English (India)" in Settings.`,
        'service-not-allowed': `Speech service not allowed in ${browser}. Try Chrome or Edge.`,
      }
      this.config.onError?.(
        messages[event.error] || `Speech error: ${event.error}. Try text input instead.`,
        event.error
      )
    }

    r.onend = () => {
      if (this.state === 'listening' || this.state === 'transcribing') this.setState('idle')
    }

    try { r.start() } catch {
      this.setState('error')
      this.config.onError?.('Could not start speech recognition. Try reloading.', 'start_failed')
    }
  }

  stop()  { if (this.recognition) { try { this.recognition.stop()  } catch { /**/ } this.recognition = null } this.setState('idle') }
  abort() { if (this.recognition) { try { this.recognition.abort() } catch { /**/ } this.recognition = null } this.setState('idle') }
  updateLanguage(lang: string) { this.config.language = lang }
}
