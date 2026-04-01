export const sendMessage = async (message) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        role: 'bot',
        message: message?.trim()
          ? 'Mindi รับฟังอยู่นะ เล่าให้ฟังได้เลย'
          : 'Mindi รับฟังอยู่นะ เล่าให้ฟังได้เลย',
        time: new Date().toLocaleTimeString().slice(0, 5),
      })
    }, 1000)
  })
}
