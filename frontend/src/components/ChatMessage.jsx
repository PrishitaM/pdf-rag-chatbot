import ReactMarkdown from 'react-markdown'
import { BookOpen } from 'lucide-react'
import clsx from 'clsx'

export default function ChatMessage({ message, isStreaming = false, streamText = '', streamPages = [] }) {
  const isUser = message?.role === 'user'
  const content = isStreaming ? streamText : message?.content
  const pages = isStreaming
    ? streamPages
    : message?.pages_used?.split(',').filter(Boolean).map(Number) ?? []

  return (
    <div className={clsx('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5',
        isUser ? 'bg-accent text-white' : 'bg-card border border-border text-muted',
      )}>
        {isUser ? 'You' : 'AI'}
      </div>

      <div className={clsx('max-w-[80%]', isUser ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
        {/* Bubble */}
        <div className={clsx(
          'rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm',
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown>{content || ''}</ReactMarkdown>
              {isStreaming && <span className="cursor text-accent">▍</span>}
            </div>
          )}
        </div>

        {/* Pages badge */}
        {pages.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface border border-border">
            <BookOpen size={10} className="text-accent" />
            <span className="text-[10px] text-muted font-mono">
              Page{pages.length > 1 ? 's' : ''} {pages.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
