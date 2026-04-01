export const sendMessage = async (message) => {
  // ดึง URL ของ Cloudflare มาจากไฟล์ .env
  const apiUrl = import.meta.env.VITE_API_URL

  if (!apiUrl) {
    console.error('API URL หายไป! อย่าลืมตั้งค่า VITE_API_URL ในไฟล์ .env นะครับ')
    throw new Error('Missing API URL')
  }

  try {
    // ยิงคำถามไปหาบอทที่ Colab ผ่าน Cloudflare
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // แปลงข้อความให้อยู่ในรูปแบบ { query: "ข้อความ" } ตามที่ FastAPI รอรับ
      body: JSON.stringify({ query: message?.trim() }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // รอรับคำตอบที่บอทส่งกลับมา
    const data = await response.json()

    // ส่ง Object รูปแบบเดิมกลับไปให้ useChat.js เอาไปแสดงผล
    return {
      role: 'bot',
      message: data.reply || 'ขออภัย Mindi ประมวลผลคำตอบไม่ได้ในขณะนี้',
      time: new Date().toLocaleTimeString().slice(0, 5),
    }

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Mindi:', error)
    // โยน Error กลับไป เพื่อให้ useChat.js เรียกใช้ fallbackReply ("ตอนนี้ Mindi ยังอยู่ตรงนี้นะ...")
    throw error
  }
}