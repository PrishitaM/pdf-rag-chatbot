import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatPage />
      </main>
    </div>
  )
}
