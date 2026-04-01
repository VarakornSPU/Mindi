const createFallbackId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : createFallbackId()

export const formatMessageText = (value = '') =>
  value.replace(/\s+/g, ' ').trim()

export const formatTime = (date = new Date()) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

export const normalizeTime = (value) => {
  if (typeof value !== 'string') {
    return formatTime()
  }

  const matchedTime = value.match(/\d{1,2}:\d{2}/)

  return matchedTime ? matchedTime[0].padStart(5, '0') : formatTime()
}

export const createMessage = ({ id, role, message, time }) => ({
  id: id ?? createId(),
  role,
  message: formatMessageText(message),
  time: normalizeTime(time),
})
