import { useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Plus, MessageSquare, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

export default function Sidebar() {
  const {
    documents, fetchDocuments, uploadDocument, deleteDocument, loadingDocs,
    sessions, fetchSessions, createSession, openSession, deleteSession, activeSession,
  } = useStore()

  const [expandedDoc, setExpandedDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    fetchDocuments()
    fetchSessions()
  }, [])

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return alert('Please upload a PDF file.')
    setUploading(true)
    try {
      await uploadDocument(file)
    } catch (e) {
      alert(e.message)
    } finally {
      setUploading(false)
    }
  }

  const sessionsForDoc = (docId) => sessions.filter((s) => s.document_id === docId)

  return (
    <aside className="w-64 min-w-[240px] bg-panel border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="font-semibold text-bright text-sm">PDF RAG Chat</span>
        </div>
        <p className="text-muted text-xs">Chat with your documents</p>
      </div>

      {/* Upload area */}
      <div className="p-3 border-b border-border">
        <div
          className={clsx(
            'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
            dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-accent-dim',
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <Upload size={16} className="mx-auto mb-1 text-muted" />
          <p className="text-xs text-muted">
            {uploading ? 'Processing…' : 'Drop PDF or click to upload'}
          </p>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {/* Document + Session list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingDocs && (
          <p className="text-muted text-xs text-center py-4">Loading…</p>
        )}

        {documents.length === 0 && !loadingDocs && (
          <p className="text-muted text-xs text-center py-8">No documents yet.<br />Upload a PDF to start.</p>
        )}

        {documents.map((doc) => {
          const docSessions = sessionsForDoc(doc.id)
          const isExpanded = expandedDoc === doc.id

          return (
            <div key={doc.id}>
              {/* Document row */}
              <div
                className={clsx(
                  'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group',
                  'hover:bg-card transition-colors',
                )}
                onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
              >
                <div className={clsx(
                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                  doc.status === 'ready' ? 'bg-accent/20 text-accent' : 'bg-yellow-500/20 text-yellow-400',
                )}>
                  <FileText size={11} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bright truncate">{doc.original_name}</p>
                  <p className="text-[10px] text-muted">{doc.page_count}p · {(doc.file_size / 1024).toFixed(0)} KB</p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); createSession(doc.id, doc.original_name) }}
                    className="p-1 hover:text-accent text-muted rounded"
                    title="New chat"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete document and all its chats?')) deleteDocument(doc.id) }}
                    className="p-1 hover:text-red-400 text-muted rounded"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                  {isExpanded ? <ChevronDown size={12} className="text-muted" /> : <ChevronRight size={12} className="text-muted" />}
                </div>
              </div>

              {/* Sessions under this document */}
              {isExpanded && (
                <div className="ml-4 space-y-0.5 mb-1">
                  {docSessions.length === 0 && (
                    <button
                      onClick={() => createSession(doc.id, doc.original_name)}
                      className="w-full text-left px-2 py-1.5 text-xs text-muted hover:text-accent flex items-center gap-1.5 rounded"
                    >
                      <Plus size={11} /> Start a chat
                    </button>
                  )}
                  {docSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => openSession(s)}
                      className={clsx(
                        'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-colors',
                        activeSession?.id === s.id ? 'bg-accent/20 text-accent' : 'hover:bg-card text-muted hover:text-bright',
                      )}
                    >
                      <MessageSquare size={11} className="flex-shrink-0" />
                      <span className="text-xs truncate flex-1">{s.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
