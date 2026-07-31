import { useState } from 'react'
import { Send } from 'lucide-react'
import clsx from 'clsx'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="border-t border-border bg-panel p-4">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={disabled ? 'Waiting for response…' : 'Ask anything about the document… (Enter to send, Shift+Enter for newline)'}
          rows={1}
          className={clsx(
            'input-base resize-none max-h-32 overflow-y-auto',
            'scrollbar-thin text-sm leading-relaxed',
          )}
          style={{ minHeight: '44px' }}
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className="btn-primary flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl p-0"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-[10px] text-muted text-center mt-2">
        Answers are grounded in the document. Page numbers are shown below each response.
      </p>
    </div>
  )
}
