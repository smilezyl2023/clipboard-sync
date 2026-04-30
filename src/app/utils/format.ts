export function isImageMime(mime: string | undefined): boolean {
  return !!mime && mime.startsWith('image/')
}

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\-一-龥]/g, '_').slice(0, 120)
  return cleaned || 'file'
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRemaining(expiresAt: number): { text: string; urgent: boolean } {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return { text: '已过期', urgent: true }
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { text: `${mins} 分钟后删除`, urgent: mins < 10 }
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return { text: `${hours} 小时${rem > 0 ? ' ' + rem + ' 分' : ''}后删除`, urgent: false }
}
