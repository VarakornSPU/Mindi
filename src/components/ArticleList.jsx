function ArticleList({ articles, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white/80 p-4 shadow-lg backdrop-blur-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#333]">บทความให้กำลังใจ</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-[#888] transition hover:text-[#333]"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => onSelect(article)}
              className="rounded-2xl bg-white/70 p-4 text-left shadow-lg transition hover:brightness-95"
            >
              <p className="text-base font-medium text-[#333]">{article.title}</p>
              <p className="mt-1 text-sm text-[#888]">{article.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ArticleList
