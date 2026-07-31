import { create } from 'zustand'
import * as api from '../services/api'

export const useStore = create((set, get) => ({
  // ─── Documents ─────────────────────────────────
  documents: [],
  loadingDocs: false,

  fetchDocuments: async () => {
    set({ loadingDocs: true })
    try {
      const docs = await api.listDocuments()
      set({ documents: docs })
    } finally {
      set({ loadingDocs: false })
    }
  },

  uploadDocument: async (file) => {
    const doc = await api.uploadDocument(file)
    set((s) => ({ documents: [doc, ...s.documents] }))
    return doc
  },

  deleteDocument: async (id) => {
    await api.deleteDocument(id)
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      // clear active session if it was on this doc
      sessions: s.sessions.filter((sess) => sess.document_id !== id),
      activeSession: s.activeSession?.document_id === id ? null : s.activeSession,
      messages: s.activeSession?.document_id === id ? [] : s.messages,
    }))
  },

  // ─── Sessions ──────────────────────────────────
  sessions: [],
  activeSession: null,

  fetchSessions: async () => {
    const sessions = await api.listSessions()
    set({ sessions })
  },

  createSession: async (document_id, title) => {
    const session = await api.createSession(document_id, title)
    set((s) => ({ sessions: [session, ...s.sessions] }))
    get().openSession(session)
    return session
  },

  openSession: async (session) => {
    set({ activeSession: session, messages: [], streaming: false })
    const history = await api.getHistory(session.id)
    set({ messages: history })
  },

  deleteSession: async (id) => {
    await api.deleteSession(id)
    set((s) => ({
      sessions: s.sessions.filter((s) => s.id !== id),
      activeSession: s.activeSession?.id === id ? null : s.activeSession,
      messages: s.activeSession?.id === id ? [] : s.messages,
    }))
  },

  // ─── Messages ──────────────────────────────────
  messages: [],
  streaming: false,
  streamingText: '',
  streamingPages: [],
  error: null,

  sendMessage: async (text) => {
    const { activeSession } = get()
    if (!activeSession || !text.trim()) return

    // Optimistic user message
    const userMsg = { id: Date.now(), role: 'user', content: text, pages_used: '' }
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true, streamingText: '', streamingPages: [], error: null }))

    api.streamMessage(activeSession.id, text, {
      onToken: (token) => set((s) => ({ streamingText: s.streamingText + token })),
      onPages: (pages) => set({ streamingPages: pages }),
      onDone: () => {
        const { streamingText, streamingPages, messages } = get()
        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: streamingText,
          pages_used: streamingPages.join(','),
        }
        set({ messages: [...messages, assistantMsg], streaming: false, streamingText: '', streamingPages: [] })
      },
      onError: (err) => {
        set({ streaming: false, error: err.message, streamingText: '' })
      },
    })
  },
}))
