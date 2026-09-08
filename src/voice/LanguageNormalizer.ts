// LanguageNormalizer.ts
// Normalizes English, Tamil, and Tanglish input into a unified form
// for the intent engine. NOT a translation engine — it normalizes
// intent-bearing vocabulary so the rule engine can match patterns.

type DetectedLanguage = 'en' | 'ta' | 'tanglish' | 'mixed'

interface NormalizeResult {
  normalized: string
  detectedLanguage: DetectedLanguage
  original: string
}

// ── Tamil Unicode detection ───────────────────────────────────────────────────
function hasTamilScript(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text)
}

// ── Rough Tanglish detection (Roman letters with Tamil phoneme patterns) ─────
function hasTanglishPatterns(text: string): boolean {
  const patterns = [
    /\bpannu\b/i, /\bpanni\b/i, /\bsollu\b/i, /\bpadichu\b/i,
    /\bkandupidi/i, /\banuppu\b/i, /\bnyabagam\b/i, /\bla\b/i,
    /\bile\b/i, /\bnalaikku\b/i, /\bnaalaikku\b/i, /\bku\b/i,
    /\benna\b/i, /\beppo\b/i, /\bille\b/i, /\bvaa\b/i,
  ]
  return patterns.some(p => p.test(text))
}

// ── Tanglish → normalized English mapping ────────────────────────────────────
const TANGLISH_MAP: Array<[RegExp, string]> = [
  // Find intent
  [/\bkandupidichu\b/gi, 'find'],
  [/\bkandupidi\b/gi, 'find'],
  [/\bkandu pidichu\b/gi, 'find'],
  [/\bkandu pidi\b/gi, 'find'],
  [/\btedi\b/gi, 'find'],
  [/\btedi paar\b/gi, 'find'],

  // Read/tell
  [/\bpadichu sollu\b/gi, 'read and tell me'],
  [/\bpadichu\b/gi, 'read'],
  [/\bsollu\b/gi, 'tell me'],
  [/\bsoll\b/gi, 'tell'],
  [/\bpaar\b/gi, 'check'],

  // Share/send
  [/\bshare pannu\b/gi, 'share'],
  [/\banuppi podu\b/gi, 'send'],
  [/\banuppu\b/gi, 'send'],
  [/\banuppi\b/gi, 'send'],

  // Reminder
  [/\bnyabagam paduthu\b/gi, 'remind'],
  [/\bnyabagam\b/gi, 'reminder'],
  [/\bnenpam\b/gi, 'reminder'],
  [/\breminder podu\b/gi, 'create reminder'],
  [/\balert podu\b/gi, 'create reminder'],

  // Action verb forms
  [/\bpannu\b/gi, ''],
  [/\bpanni\b/gi, ''],
  [/\bpodu\b/gi, ''],

  // Locative markers
  [/\bla\b/gi, 'in'],
  [/\bile\b/gi, 'in'],

  // Object markers
  [/\bai\b/gi, ''],
  [/\bkku\b/gi, 'to'],
  [/\bku\b/gi, 'to'],

  // Time
  [/\bnalaikku\b/gi, 'tomorrow'],
  [/\bnaalaikku\b/gi, 'tomorrow'],
  [/\bippove\b/gi, 'now'],
  [/\bkaalaila\b/gi, 'morning'],
  [/\bmaalai\b/gi, 'evening'],
]

// ── Tamil Unicode → normalized English mapping ────────────────────────────────
const TAMIL_MAP: Array<[RegExp, string]> = [
  [/கண்டுபிடிச்சு/g, 'find'],
  [/கண்டுபிடி/g, 'find'],
  [/தேடு/g, 'find'],
  [/தேடி/g, 'find'],
  [/படி/g, 'read'],
  [/படிக்க/g, 'read'],
  [/சொல்லு/g, 'tell me'],
  [/சொல்/g, 'tell'],
  [/அனுப்பு/g, 'send'],
  [/அனுப்பி/g, 'send'],
  [/நினைவூட்டு/g, 'remind'],
  [/நினைவூட்டல்/g, 'reminder'],
  [/நாளைக்கு/g, 'tomorrow'],
  [/நாளை/g, 'tomorrow'],
  [/இன்று/g, 'today'],
  [/காலை/g, 'morning'],
  [/மாலை/g, 'evening'],
  [/என்/g, 'my'],
  [/ஐ/g, ''],
  [/ல்/g, 'in'],
  [/ல/g, 'in'],
  [/க்கு/g, 'to'],
  [/டவுன்லோட்/g, 'downloads'],
  [/ஆவணம்/g, 'document'],
  [/கோப்பு/g, 'file'],
  [/இன்வாய்ஸ்/g, 'invoice'],
  [/பில்/g, 'bill'],
  [/தொகை/g, 'amount'],
  [/விலை/g, 'price'],
]

export class LanguageNormalizer {
  normalize(input: string): NormalizeResult {
    const original = input.trim()
    let text = original
    let detectedLanguage: DetectedLanguage = 'en'

    if (hasTamilScript(text)) {
      // Apply Tamil map first
      for (const [pattern, replacement] of TAMIL_MAP) {
        text = text.replace(pattern, replacement)
      }
      // After replacement, if mixed with English
      if (/[a-zA-Z]{3,}/.test(text)) {
        detectedLanguage = 'mixed'
      } else {
        detectedLanguage = 'ta'
      }
    } else if (hasTanglishPatterns(text)) {
      detectedLanguage = 'tanglish'
    } else {
      detectedLanguage = 'en'
    }

    // Apply Tanglish map regardless (may mix in sentences)
    for (const [pattern, replacement] of TANGLISH_MAP) {
      text = text.replace(pattern, replacement)
    }

    // Clean up multiple spaces
    text = text.replace(/\s+/g, ' ').trim()

    return {
      normalized: text,
      detectedLanguage,
      original,
    }
  }
}

export type { NormalizeResult, DetectedLanguage }
