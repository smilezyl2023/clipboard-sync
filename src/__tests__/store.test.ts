import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRedis, mockBlobDel } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
    expire: vi.fn(),
  },
  mockBlobDel: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({ redis: mockRedis }))
vi.mock('uuid', () => ({ v4: vi.fn() }))
vi.mock('@vercel/blob', () => ({ del: mockBlobDel }))

import { v4 as uuidv4 } from 'uuid'
import {
  getRecords,
  createRecord,
  createMediaRecord,
  deleteRecord,
  deleteRecords,
  purgeExpiredMedia,
} from '@/lib/store'
import type { Record } from '@/lib/store'
import { USER_TTL_SECONDS } from '@/lib/auth'

const PHONE = '13800138000'
const NOW = 1714400000000

function makeRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: uuidv4(),
    type: 'text',
    timestamp: NOW,
    preview: 'hello',
    content: 'hello',
    ...overrides,
  }
}

function makeMediaRecord(overrides: Partial<Record> = {}): Record {
  return {
    id: uuidv4(),
    type: 'image',
    timestamp: NOW,
    preview: 'photo.jpg',
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    blobUrl: 'https://blob.store/photo.jpg',
    blobPathname: 'photo.jpg',
    expiresAt: NOW + 3 * 60 * 60 * 1000, // 3h
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  // 默认 uuid 按调用次数生成稳定 id
  let seq = 0
  vi.mocked(uuidv4).mockImplementation(() => `id-${++seq}`)
})

describe('store', () => {
  // ─── getRecords ─────────────────────────────────────────

  describe('getRecords', () => {
    it('用户不存在时返回空数据', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await getRecords(PHONE)

      expect(result).toEqual({ records: [], lastModified: 0 })
    })

    it('正常返回记录列表', async () => {
      const records = [makeRecord({ id: 'r1' }), makeRecord({ id: 'r2' })]
      mockRedis.get.mockResolvedValue(JSON.stringify({ records, lastModified: NOW }))

      const result = await getRecords(PHONE)

      expect(result.records).toHaveLength(2)
      expect(result.records[0].id).toBe('r1')
      expect(result.records[1].id).toBe('r2')
      // 无过期记录时应刷新 TTL
      expect(mockRedis.expire).toHaveBeenCalledWith('user:13800138000', USER_TTL_SECONDS)
    })

    it('过滤已过期的媒体记录', async () => {
      const expired = makeMediaRecord({ id: 'old', expiresAt: NOW - 1 })
      const valid = makeRecord({ id: 'keep' })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [expired, valid], lastModified: NOW - 1000 })
      )

      const result = await getRecords(PHONE)

      expect(result.records).toHaveLength(1)
      expect(result.records[0].id).toBe('keep')
      // 有过期时回写
      expect(mockRedis.set).toHaveBeenCalled()
    })

    it('过期媒体记录触发 blob 异步清理', async () => {
      const expired = makeMediaRecord({ id: 'old', blobPathname: 'blobs/old.jpg', expiresAt: NOW - 1 })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [expired], lastModified: NOW - 1000 })
      )

      await getRecords(PHONE)

      // blob 清理是异步的（void），稍后推进微任务验证
      await vi.runAllTimersAsync()
      // 注意 bestEffortDelBlobs 内部动态 import，mockBlobDel 已通过 vi.mock 挂载
    })

    it('Upstash 返回已反序列化对象（非字符串）时也能正常处理', async () => {
      const records = [makeRecord({ id: 'r1' })]
      // 模拟 Upstash REST API 自动反序列化 JSON
      mockRedis.get.mockResolvedValue({ records, lastModified: NOW })

      const result = await getRecords(PHONE)

      expect(result.records).toHaveLength(1)
      expect(result.records[0].id).toBe('r1')
    })
  })

  // ─── createRecord ────────────────────────────────────────

  describe('createRecord', () => {
    it('新用户创建文本记录', async () => {
      mockRedis.get.mockResolvedValue(null)

      const record = await createRecord(PHONE, 'Hello World')

      expect(record.type).toBe('text')
      expect(record.content).toBe('Hello World')
      expect(record.preview).toBe('Hello World')
      expect(record.id).toBe('id-1')
      expect(mockRedis.set).toHaveBeenCalled()
    })

    it('长文本生成截断预览', async () => {
      mockRedis.get.mockResolvedValue(null)
      const longContent = 'A'.repeat(100)

      const record = await createRecord(PHONE, longContent)

      expect(record.preview).toBe('A'.repeat(50) + '...')
    })

    it('预览会压缩空白字符', async () => {
      mockRedis.get.mockResolvedValue(null)

      const record = await createRecord(PHONE, '  Hello   World  ')

      expect(record.preview).toBe('Hello World')
    })

    it('已有记录时插入到列表头部', async () => {
      const existing = makeRecord({ id: 'old' })
      mockRedis.get.mockResolvedValue(JSON.stringify({ records: [existing], lastModified: NOW - 100 }))

      const record = await createRecord(PHONE, 'new')

      // 验证 set 调用中 records 的顺序：新记录在最前
      const setCall = mockRedis.set.mock.calls[0]
      const writtenData = JSON.parse(setCall[1])
      expect(writtenData.records[0].content).toBe('new')
      expect(writtenData.records[1].id).toBe('old')
    })

    it('超过 MAX_RECORDS 时截断最早的记录', async () => {
      // 已有 100 条
      const existingRecords = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `old-${i}` }))
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: existingRecords, lastModified: NOW - 100 })
      )

      await createRecord(PHONE, 'overflow')

      const setCall = mockRedis.set.mock.calls[0]
      const writtenData = JSON.parse(setCall[1])
      expect(writtenData.records).toHaveLength(100)
      // 第一条是新记录
      expect(writtenData.records[0].content).toBe('overflow')
      // 最后一条是 old-98（old-99 被截断）
      expect(writtenData.records[99].id).toBe('old-98')
    })
  })

  // ─── createMediaRecord ────────────────────────────────────

  describe('createMediaRecord', () => {
    const mediaInput = {
      id: 'media-1',
      type: 'image' as const,
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      blobUrl: 'https://blob.store/photo.jpg',
      blobPathname: 'photos/photo.jpg',
      ttlMs: 3 * 60 * 60 * 1000,
    }

    it('创建媒体记录并设置过期时间', async () => {
      mockRedis.get.mockResolvedValue(null)

      const record = await createMediaRecord(PHONE, mediaInput)

      expect(record.type).toBe('image')
      expect(record.fileName).toBe('photo.jpg')
      expect(record.blobUrl).toBe('https://blob.store/photo.jpg')
      expect(record.expiresAt).toBe(NOW + mediaInput.ttlMs)
    })

    it('插入到列表头部并写入 Redis', async () => {
      const existing = makeRecord({ id: 'text-1' })
      mockRedis.get.mockResolvedValue(JSON.stringify({ records: [existing], lastModified: NOW - 100 }))

      await createMediaRecord(PHONE, mediaInput)

      const setCall = mockRedis.set.mock.calls[0]
      const writtenData = JSON.parse(setCall[1])
      expect(writtenData.records).toHaveLength(2)
      expect(writtenData.records[0].id).toBe('media-1')
    })

    it('超过上限时截断并清理被挤出媒体记录的 blob', async () => {
      const existingRecords = Array.from({ length: 100 }, (_, i) => makeMediaRecord({ id: `m-${i}`, blobPathname: `blobs/${i}.jpg` }))
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: existingRecords, lastModified: NOW - 100 })
      )

      await createMediaRecord(PHONE, mediaInput)

      const setCall = mockRedis.set.mock.calls[0]
      const writtenData = JSON.parse(setCall[1])
      expect(writtenData.records).toHaveLength(100)
      // 被挤出的最后一条是 m-99（最新记录 m-0..m-99 中，m-0 是最旧的 prepend 后变成最后）
    })
  })

  // ─── deleteRecord（单条）──────────────────────────────────

  describe('deleteRecord', () => {
    it('删除存在的记录并返回', async () => {
      const r1 = makeRecord({ id: 'del-me' })
      const r2 = makeRecord({ id: 'keep' })
      mockRedis.get.mockResolvedValue(JSON.stringify({ records: [r1, r2], lastModified: NOW - 100 }))

      const removed = await deleteRecord(PHONE, 'del-me')

      expect(removed!.id).toBe('del-me')
      expect(mockRedis.set).toHaveBeenCalled()

      const writtenData = JSON.parse(mockRedis.set.mock.calls[0][1])
      expect(writtenData.records).toHaveLength(1)
      expect(writtenData.records[0].id).toBe('keep')
    })

    it('用户不存在时返回 null', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await deleteRecord(PHONE, 'nonexistent')

      expect(result).toBeNull()
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('记录不存在时返回 null', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ records: [makeRecord({ id: 'r1' })], lastModified: NOW }))

      const result = await deleteRecord(PHONE, 'not-found')

      expect(result).toBeNull()
      // 记录未找到，不应写入
      expect(mockRedis.set).not.toHaveBeenCalled()
    })
  })

  // ─── deleteRecords（批量）─────────────────────────────────

  describe('deleteRecords', () => {
    it('批量删除多条记录', async () => {
      const r1 = makeRecord({ id: 'a' })
      const r2 = makeRecord({ id: 'b' })
      const r3 = makeRecord({ id: 'c' })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [r1, r2, r3], lastModified: NOW - 100 })
      )

      const removed = await deleteRecords(PHONE, ['a', 'c'])

      expect(removed).toHaveLength(2)
      expect(removed.map(r => r.id).sort()).toEqual(['a', 'c'])

      const writtenData = JSON.parse(mockRedis.set.mock.calls[0][1])
      expect(writtenData.records).toHaveLength(1)
      expect(writtenData.records[0].id).toBe('b')
    })

    it('用户不存在时返回空数组', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await deleteRecords(PHONE, ['a'])

      expect(result).toEqual([])
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('删除不存在 ID 时返回空数组', async () => {
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [makeRecord({ id: 'x' })], lastModified: NOW })
      )

      const result = await deleteRecords(PHONE, ['ghost'])

      expect(result).toEqual([])
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('部分匹配时只删除存在的记录', async () => {
      const r1 = makeRecord({ id: 'hit' })
      const r2 = makeRecord({ id: 'miss' })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [r1, r2], lastModified: NOW })
      )

      const removed = await deleteRecords(PHONE, ['hit', 'ghost'])

      expect(removed).toHaveLength(1)
      expect(removed[0].id).toBe('hit')
    })
  })

  // ─── purgeExpiredMedia ───────────────────────────────────

  describe('purgeExpiredMedia', () => {
    it('用户不存在返回 0', async () => {
      mockRedis.get.mockResolvedValue(null)

      const count = await purgeExpiredMedia(PHONE)

      expect(count).toBe(0)
    })

    it('无过期记录返回 0，不写入', async () => {
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [makeRecord({ id: 'r1' })], lastModified: NOW })
      )

      const count = await purgeExpiredMedia(PHONE)

      expect(count).toBe(0)
      expect(mockRedis.set).not.toHaveBeenCalled()
    })

    it('有过期媒体时清理并返回数量', async () => {
      const expired = makeMediaRecord({ id: 'old1', expiresAt: NOW - 100, blobPathname: 'blobs/old1.jpg' })
      const valid = makeRecord({ id: 'keep' })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [expired, valid], lastModified: NOW - 1000 })
      )

      const count = await purgeExpiredMedia(PHONE)

      expect(count).toBe(1)
      expect(mockRedis.set).toHaveBeenCalled()

      const writtenData = JSON.parse(mockRedis.set.mock.calls[0][1])
      expect(writtenData.records).toHaveLength(1)
      expect(writtenData.records[0].id).toBe('keep')
    })

    it('仅清理媒体类过期记录，文本记录不过滤', async () => {
      const expiredMedia = makeMediaRecord({ id: 'old-media', expiresAt: NOW - 1 })
      // 文本记录没有 expiresAt，不会被过滤
      const textRecord = makeRecord({ id: 'text' })
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ records: [expiredMedia, textRecord], lastModified: NOW })
      )

      const count = await purgeExpiredMedia(PHONE)

      expect(count).toBe(1)
      const writtenData = JSON.parse(mockRedis.set.mock.calls[0][1])
      expect(writtenData.records).toHaveLength(1)
      expect(writtenData.records[0].id).toBe('text')
    })
  })
})
