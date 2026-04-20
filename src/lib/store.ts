import { v4 as uuidv4 } from 'uuid'
import { redis } from './redis'
import { USER_TTL_SECONDS } from './auth'

export type RecordType = 'text' | 'image' | 'file'

export interface Record {
  id: string
  timestamp: number
  preview: string
  // 类型缺省视为 text，兼容旧数据
  type?: RecordType
  // 仅 text
  content?: string
  // 仅 image / file
  fileName?: string
  mimeType?: string
  size?: number
  blobUrl?: string
  blobPathname?: string
  // 媒体类过期时间戳，文本记录不设置
  expiresAt?: number
}

interface UserData {
  records: Record[]
  lastModified: number
}

const MAX_RECORDS = 100
const EMPTY: UserData = { records: [], lastModified: 0 }

function createPreview(content: string): string {
  const text = content.replace(/\s+/g, ' ').trim()
  return text.length > 50 ? text.substring(0, 50) + '...' : text
}

function userKey(phone: string): string {
  return `user:${phone}`
}

function isMedia(r: Record): boolean {
  return r.type === 'image' || r.type === 'file'
}

async function readUser(phone: string): Promise<UserData | null> {
  // Upstash REST 会对 JSON 字符串自动反序列化，返回可能是对象也可能是字符串
  const raw = await redis.get<UserData | string | null>(userKey(phone))
  if (raw === null || raw === undefined) return null
  return typeof raw === 'string' ? (JSON.parse(raw) as UserData) : raw
}

async function writeUser(phone: string, data: UserData): Promise<void> {
  await redis.set(userKey(phone), JSON.stringify(data), { ex: USER_TTL_SECONDS })
}

// 异步删除 blob，不阻塞主流程；失败打 warn 由 cron 兜底
async function bestEffortDelBlobs(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return
  try {
    const { del } = await import('@vercel/blob')
    await del(pathnames)
  } catch (err) {
    console.warn('删除 blob 失败（将由 cron 兜底清理）:', err)
  }
}

export async function getRecords(
  phone: string
): Promise<{ records: Record[]; lastModified: number }> {
  const user = await readUser(phone)
  if (!user) return EMPTY

  // lazy 过滤：剔除已过期媒体；若发生变更则回写并异步删 blob
  const now = Date.now()
  const expired: Record[] = []
  const kept = user.records.filter(r => {
    if (isMedia(r) && r.expiresAt && r.expiresAt <= now) {
      expired.push(r)
      return false
    }
    return true
  })

  if (expired.length > 0) {
    user.records = kept
    user.lastModified = now
    await writeUser(phone, user)
    // 不 await：避免阻塞读请求
    void bestEffortDelBlobs(
      expired.map(r => r.blobPathname).filter((p): p is string => !!p)
    )
  } else {
    // 访问即刷新 TTL，7 天空窗期才会被清理
    await redis.expire(userKey(phone), USER_TTL_SECONDS)
  }

  return { records: user.records, lastModified: user.lastModified }
}

export async function createRecord(phone: string, content: string): Promise<Record> {
  const user = (await readUser(phone)) ?? { records: [], lastModified: 0 }

  const record: Record = {
    id: uuidv4(),
    type: 'text',
    content,
    preview: createPreview(content),
    timestamp: Date.now(),
  }

  user.records.unshift(record)
  if (user.records.length > MAX_RECORDS) {
    user.records = user.records.slice(0, MAX_RECORDS)
  }
  user.lastModified = record.timestamp

  await writeUser(phone, user)
  return record
}

// 媒体记录（图片/文件）元数据写入；blob 已由客户端直传完成
export async function createMediaRecord(
  phone: string,
  input: {
    id: string
    type: 'image' | 'file'
    fileName: string
    mimeType: string
    size: number
    blobUrl: string
    blobPathname: string
    ttlMs: number
  }
): Promise<Record> {
  const user = (await readUser(phone)) ?? { records: [], lastModified: 0 }

  const now = Date.now()
  const record: Record = {
    id: input.id,
    type: input.type,
    timestamp: now,
    preview: input.fileName,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    blobUrl: input.blobUrl,
    blobPathname: input.blobPathname,
    expiresAt: now + input.ttlMs,
  }

  user.records.unshift(record)
  if (user.records.length > MAX_RECORDS) {
    // 被挤出的媒体记录也应清掉其 blob
    const dropped = user.records.slice(MAX_RECORDS)
    user.records = user.records.slice(0, MAX_RECORDS)
    void bestEffortDelBlobs(
      dropped.filter(isMedia).map(r => r.blobPathname).filter((p): p is string => !!p)
    )
  }
  user.lastModified = now

  await writeUser(phone, user)
  return record
}

// 返回被删除的记录（供上层清理 blob）
export async function deleteRecord(phone: string, id: string): Promise<Record | null> {
  const user = await readUser(phone)
  if (!user) return null

  const idx = user.records.findIndex(r => r.id === id)
  if (idx === -1) return null

  const [removed] = user.records.splice(idx, 1)
  user.lastModified = Date.now()
  await writeUser(phone, user)
  return removed
}

export async function deleteRecords(phone: string, ids: string[]): Promise<Record[]> {
  const user = await readUser(phone)
  if (!user) return []

  const idSet = new Set(ids)
  const removed: Record[] = []
  user.records = user.records.filter(r => {
    if (idSet.has(r.id)) {
      removed.push(r)
      return false
    }
    return true
  })

  if (removed.length > 0) {
    user.lastModified = Date.now()
    await writeUser(phone, user)
  }
  return removed
}

// 扫描当前用户所有过期媒体记录并清理（供 cron 使用）
export async function purgeExpiredMedia(phone: string): Promise<number> {
  const user = await readUser(phone)
  if (!user) return 0

  const now = Date.now()
  const expired: Record[] = []
  const kept = user.records.filter(r => {
    if (isMedia(r) && r.expiresAt && r.expiresAt <= now) {
      expired.push(r)
      return false
    }
    return true
  })

  if (expired.length === 0) return 0

  user.records = kept
  user.lastModified = now
  await writeUser(phone, user)
  await bestEffortDelBlobs(
    expired.map(r => r.blobPathname).filter((p): p is string => !!p)
  )
  return expired.length
}
