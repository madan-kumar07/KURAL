// GeminiLLMService.ts — Optional LLM intent fallback via Google Gemini REST API

export interface GeminiIntentResponse {
  actions: Array<{
    type: string
    [key: string]: any
  }>
  confidence: number
}

export async function queryGeminiIntent(input: string): Promise<GeminiIntentResponse | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey.includes('YOUR_API_KEY')) return null

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are KURAL, a personal multilingual AI assistant. Parse the user request into an action plan.
Current time: ${new Date().toISOString()}

Valid action types and their expected arguments:
- FIND_FILE: { type: "FIND_FILE", query: string, sort: "latest"|"oldest"|"name", limit: number }
- READ_FILE: { type: "READ_FILE", source: "previous_result", extract: string[] }
- SHARE_FILE: { type: "SHARE_FILE", contact: string, source: "previous_result" }
- CREATE_REMINDER: { type: "CREATE_REMINDER", title: string, triggerTime: string (ISO8601), message?: string }
- OPEN_APP: { type: "OPEN_APP", app: string, url: string, query?: string }
- SEARCH_WEB: { type: "SEARCH_WEB", query: string, engine: "google"|"youtube" }
- PLAY_MUSIC: { type: "PLAY_MUSIC", query: string, platform: "youtube"|"spotify"|"gaana"|"jiosaavn" }
- SEND_WHATSAPP: { type: "SEND_WHATSAPP", contact: string, message: string }
- SET_TIMER: { type: "SET_TIMER", duration: number (seconds), label: string }
- OPEN_MAPS: { type: "OPEN_MAPS", destination: string }
- MAKE_CALL: { type: "MAKE_CALL", contact: string }

User input: "${input}"
Return ONLY raw JSON in this structure: { "actions": [ { "type": "...", ... } ], "confidence": 0.95 }`
            }]
          }]
        })
      }
    )

    if (!response.ok) return null
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GeminiIntentResponse
    }
  } catch (err) {
    console.warn('Gemini API call warning (falling back to local engine):', err)
  }
  return null
}
