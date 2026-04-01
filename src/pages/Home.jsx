import { useState } from 'react'
import MindiLogo from '../assets/MindiLogo.png'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'

const articleHighlights = [
  {
    icon: 'bi bi-heart-pulse',
    title: 'เริ่มจากฟังตัวเองให้ชัด',
    description:
      'ก่อนตอบคำถามของความสัมพันธ์ ลองหยุดสั้น ๆ แล้วเรียกชื่อความรู้สึกของตัวเองให้ชัดขึ้นอีกนิด',
  },
  {
    icon: 'bi bi-chat-quote',
    title: 'คุยเรื่องยากโดยไม่เร่งสรุป',
    description:
      'ประโยคที่นุ่มนวลและตรงไปตรงมา ช่วยให้ทั้งสองฝ่ายได้ยินกันมากกว่าการรีบหาคำตอบ',
  },
  {
    icon: 'bi bi-journal-richtext',
    title: 'ให้พื้นที่กับวันที่ใจล้า',
    description:
      'บางวันการพัก หายใจลึก ๆ และจดสิ่งที่อยู่ในใจไว้ก่อน คือการดูแลตัวเองที่สำคัญมาก',
  },
]

function Home({ onStartChat }) {
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)

  const handleOpenArticles = () => {
    setIsArticleModalOpen(true)
  }

  const handleCloseArticles = () => {
    setIsArticleModalOpen(false)
  }

  const handleStartFromModal = () => {
    handleCloseArticles()
    onStartChat()
  }

  return (
    <>
      <section className="screen screen--home">
        <div className="mindi-device mindi-device--home">
          <div className="home-scene" aria-hidden="true">
            <span className="home-cloud home-cloud--one" />
            <span className="home-cloud home-cloud--two" />
            <span className="home-spark home-spark--one" />
            <span className="home-spark home-spark--two" />
          </div>

          <div className="home-brand">
            <img
              className="home-brand__logo"
              src={MindiLogo}
              alt="Mindi logo"
            />
            <span className="home-brand__pill">
              พื้นที่เล็ก ๆ สำหรับวันที่ใจอยากมีคนรับฟัง
            </span>
          </div>

          <div className="home-copy">
            <span className="home-copy__eyebrow">Care for the heart</span>
            <h1 className="home-copy__title">วันนี้เป็นยังไงบ้าง</h1>
            <p className="home-copy__subtitle">Mindi พร้อมรับฟังคุณเสมอ</p>
          </div>

          <div className="home-cards">
            <Card
              eyebrow="Conversation"
              icon={<i className="bi bi-chat-heart" aria-hidden="true" />}
              title="เริ่มคุยกับ Mindi"
              description="ค่อย ๆ เล่าเรื่องความสัมพันธ์ ความกังวล หรือสิ่งที่ยังค้างอยู่ในใจได้ตามจังหวะของคุณ"
              actionLabel="เปิดห้องสนทนา"
              onClick={onStartChat}
            />
            <Card
              eyebrow="Guidance"
              icon={<i className="bi bi-journal-text" aria-hidden="true" />}
              title="บทความและคำแนะนำ"
              description="อ่านแนวทางสั้น ๆ เพื่อดูแลหัวใจและบทสนทนาในวันที่ยังไม่พร้อมเริ่มเล่าทั้งหมด"
              actionLabel="ดูคำแนะนำ"
              onClick={handleOpenArticles}
            />
          </div>

          <div className="home-cta">
            <Button
              fullWidth
              icon={<i className="bi bi-arrow-right-short" aria-hidden="true" />}
              onClick={onStartChat}
            >
              เริ่มต้นพูดคุย
            </Button>
            <p className="home-cta__note">
              เริ่มจากเรื่องเล็ก ๆ ก่อนก็ได้ Mindi จะค่อย ๆ รับฟังไปกับคุณ
            </p>
          </div>
        </div>
      </section>

      <Modal
        open={isArticleModalOpen}
        onClose={handleCloseArticles}
        title="บทความและคำแนะนำ"
        subtitle="แนวทางสั้น ๆ สำหรับวันที่อยากดูแลความรู้สึกตัวเองอย่างอ่อนโยน"
      >
        <div className="article-stack">
          {articleHighlights.map((article) => (
            <article className="article-note" key={article.title}>
              <span className="article-note__icon" aria-hidden="true">
                <i className={article.icon} />
              </span>
              <div>
                <h3 className="article-note__title">{article.title}</h3>
                <p className="article-note__description">
                  {article.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mindi-modal__actions">
          <Button fullWidth variant="secondary" onClick={handleStartFromModal}>
            คุยกับ Mindi ตอนนี้
          </Button>
          <Button fullWidth variant="ghost" onClick={handleCloseArticles}>
            ปิดหน้าต่าง
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default Home
