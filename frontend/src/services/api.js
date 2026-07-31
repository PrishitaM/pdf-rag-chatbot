const BASE = '/api'

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// ─── Documents ───────────────────────────────────────────────

export async function uploadDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/documents`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export const listDocuments = () => req('GET', '/documents')
export const deleteDocument = (id) => req('DELETE', `/documents/${id}`)

// ─── Sessions ────────────────────────────────────────────────

export const createSession = (document_id, title = 'New Chat') =>
  req('POST', '/sessions', { document_id, title })

export const listSessions = () => req('GET', '/sessions')
export const getSession = (id) => req('GET', `/sessions/${id}`)
export const getHistory = (id) => req('GET', `/sessions/${id}/history`)
export const deleteSession = (id) => req('DELETE', `/sessions/${id}`)

// ─── Chat (non-streaming) ────────────────────────────────────

export const sendMessage = (session_id, message) =>
  req('POST', '/chat', { session_id, message })

// ─── Chat (streaming SSE) ────────────────────────────────────

export function streamMessage(session_id, message, { onToken, onPages, onDone, onError }) {
  fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, message }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Stream request failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const data = JSON.parse(line.slice(5).trim())
            if (data.type === 'token') onToken(data.text.replace(/\\n/g, '\n'))
            if (data.type === 'pages') onPages(data.pages)
            if (data.type === 'done') onDone(data)
          } catch {
            // ignore malformed lines
          }
        }
      }
    })
    .catch(onError)
}
