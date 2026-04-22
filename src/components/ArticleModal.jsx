import { useEffect, useState } from 'react'

function ExternalLinkButton({ label, url }) {
  return (
    <button
      type="button"
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      className="flex w-full items-center justify-between rounded-2xl border border-[#D6C7F0]/45 bg-white p-3 text-left text-sm text-[#4B5563] shadow-md transition hover:bg-[#D6C7F0]/20"
    >
      <span>{label}</span>
      <i className="bi bi-box-arrow-up-right" />
    </button>
  )
}

function ArticleModal({ isOpen, articles, onClose }) {
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedArticle(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#F8F9FC]/70 p-4 backdrop-blur-lg animate-overlay-fade">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur-lg animate-modal-in md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#374151]">บทความให้กำลังใจ</h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">เลือกหัวข้อที่ต้องการอ่านเพิ่มเติม</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#93A2BC] shadow-md transition"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {!selectedArticle && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {articles.map((article) => (
              <button
                key={article.id}
                type="button"
                onClick={() => setSelectedArticle(article)}
                className="rounded-2xl border border-[#D6C7F0]/45 bg-white p-4 text-left shadow-md transition hover:bg-[#D6C7F0]/15"
              >
                <p className="text-base font-semibold text-[#374151]">{article.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{article.subtitle}</p>
              </button>
            ))}
          </div>
        )}

        {selectedArticle && (
          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#A7C7E7]/30 px-3 py-2 text-sm text-[#4B5563] shadow-md transition"
            >
              <i className="bi bi-arrow-left" />
              กลับไปดูรายการบทความ
            </button>

            <article className="rounded-2xl border border-[#D6C7F0]/45 bg-white p-4 shadow-md">
              <h4 className="text-lg font-semibold text-[#374151]">{selectedArticle.title}</h4>
              <p className="mt-2 text-sm leading-7 text-[#4B5563]">{selectedArticle.content}</p>

              <section className="mt-4 border-t border-[#E5E7EB] pt-4">
                <h5 className="text-sm font-semibold text-[#6B7280]">แหล่งอ้างอิง</h5>
                <div className="mt-2 space-y-2">
                  {selectedArticle.references.map((reference) => (
                    <ExternalLinkButton key={reference.label} label={reference.label} url={reference.url} />
                  ))}
                </div>
              </section>
            </article>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleModal
