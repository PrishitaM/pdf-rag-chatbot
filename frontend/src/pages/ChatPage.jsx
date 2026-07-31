import { useEffect, useRef } from 'react'
import { FileText, MessageSquare } from 'lucide-react'
import { useStore } from '../store/useStore'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'

export default function ChatPage() {
  const { activeSession, messages, streaming, streamingText, streamingPages, sendMessage, error } = useStore()
  const bottomRef = useRef()

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <MessageSquare size={28} className="text-muted" />
        </div>
        <div>
          <h2 className="text-bright font-semibold text-lg mb-1">No chat selected</h2>
          <p className="text-muted text-sm max-w-xs">
            Upload a PDF from the sidebar, then click <strong className="text-bright">+</strong> to start a new chat session.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-panel flex-shrink-0">
        <FileText size={16} className="text-accent flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-bright truncate">{activeSession.title}</p>
          <p className="text-[10px] text-muted">
            {activeSession.document?.original_name} · {activeSession.document?.page_count} pages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && !streaming && (
            <div className="text-center py-12">
              <p className="text-muted text-sm">Start by asking a question about the document.</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Summarise the document', 'Give me the index', 'What are the main topics?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {streaming && (
            <ChatMessage
              isStreaming
              streamText={streamingText || ''}
              streamPages={streamingPages}
              message={{ role: 'assistant' }}
            />
          )}

          {error && (
            <div className="text-red-400 text-sm text-center py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              ⚠ {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  )
}
