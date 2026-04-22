const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

function SidebarChatRow({ chat, isActive, onSelect, onDelete }) {
  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        isActive
          ? 'border-[#A7C7E7] bg-[#A7C7E7]/30 shadow-md'
          : 'border-white/70 bg-white/70 hover:bg-[#A7C7E7]/20'
      }`}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-[#374151]">{chat.title}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{formatTime(chat.updatedAt)}</p>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex rounded-2xl p-1.5 text-[#9CA3AF] transition hover:bg-white"
          aria-label="Delete chat"
          title="Delete chat"
        >
          <i className="bi bi-trash3" />
        </button>
      </div>
    </div>
  )
}

function SidebarContent({
  user,
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onOpenArticles,
  onLogout,
  onClose,
}) {
  return (
    <div className="flex h-full flex-col gap-4 bg-[#F8F9FC] p-4">
      <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D6C7F0]/45 text-[#6E7FA5] shadow-sm">
              <i className="bi bi-chat-heart" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#E67EA4]">Mindi</h2>
              <p className="text-xs text-[#9CA3AF]">พร้อมรับฟังคุณเสมอ</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-[#9CA3AF] transition hover:bg-white md:hidden"
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFB6C1] px-3 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95"
        >
          <i className="bi bi-plus-lg" />
          <span>New Chat</span>
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/80 bg-white/70 p-3 shadow-md backdrop-blur-md">
        <h3 className="text-sm font-semibold text-[#6B7280]">ประวัติแชท</h3>
        <div className="scroll-soft mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {chats.map((chat) => (
            <SidebarChatRow
              key={chat.id}
              chat={chat}
              isActive={chat.id === currentChatId}
              onSelect={() => onSelectChat(chat.id)}
              onDelete={() => onDeleteChat(chat.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={onOpenArticles}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 text-left text-sm font-medium text-[#4B5563] shadow-md transition hover:bg-[#D6C7F0]/30"
        >
          <i className="bi bi-journal-richtext text-base text-[#7C8FB0]" />
          <span>อ่านบทความให้กำลังใจ</span>
        </button>
      </section>

      <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFB6C1]/65 text-[#4B5563]">
            <i className="bi bi-person-circle" />
          </div>
          <p className="min-w-0 truncate text-sm font-medium text-[#374151]">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-2xl border border-[#D6C7F0]/50 bg-white/80 py-2 text-sm text-[#4B5563] shadow-sm transition hover:bg-[#D6C7F0]/20"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

function Sidebar({
  user,
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  onOpenArticles,
  onLogout,
  isOpen,
  onClose,
}) {
  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-white/80 bg-[#F8F9FC] md:block">
        <SidebarContent
          user={user}
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          onNewChat={onNewChat}
          onOpenArticles={onOpenArticles}
          onLogout={onLogout}
        />
      </aside>

      <div
        className={`fixed inset-0 z-30 bg-[#A7C7E7]/35 backdrop-blur-sm transition ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        } md:hidden`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/80 bg-[#F8F9FC] transition md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          user={user}
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          onNewChat={onNewChat}
          onOpenArticles={onOpenArticles}
          onLogout={onLogout}
          onClose={onClose}
        />
      </aside>
    </>
  )
}

export default Sidebar
