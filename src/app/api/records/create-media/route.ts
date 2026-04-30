import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { createMediaRecord } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_WINDOW_MS = 60 * 1000

const MEDIA_TTL_MS = 3 * 60 * 60 * 1000 // 3 小时
const IMAGE_MAX_BYTES = 10 * 1024 * 1024
const FILE_MAX_BYTES = 50 * 1024 * 1024

interface CreateMediaBody {
  id?: string
  type?: 'image' | 'file'
  fileName?: string
  mimeType?: string
  size?: number
  blobUrl?: string
  blobPathname?: string
}

export async function POST(request: Request) {
  const rl = checkRateLimit(request, 60, RATE_WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '无访问权限' }, { status: 401 })
  }

  let body: CreateMediaBody
  try {
    body = (await request.json()) as CreateMediaBody
  } catch {
    return NextResponse.json({ error: '请求体无效' }, { status: 400 })
  }

  const { id, type, fileName, mimeType, size, blobUrl, blobPathname } = body

  if (
    !id ||
    (type !== 'image' && type !== 'file') ||
    !fileName ||
    !mimeType ||
    typeof size !== 'number' ||
    !blobUrl ||
    !blobPathname
  ) {
    return NextResponse.json({ error: '字段缺失' }, { status: 400 })
  }

  // 二次校验：pathname 必须属于当前用户
  if (!blobPathname.startsWith(`clipboard/${phone}/${id}/`)) {
    // 上传已完成但路径非法，顺手删除避免孤儿 blob
    try {
      await del(blobPathname)
    } catch {}
    return NextResponse.json({ error: '非法的 blob 路径' }, { status: 400 })
  }

  const maxBytes = type === 'image' ? IMAGE_MAX_BYTES : FILE_MAX_BYTES
  if (size <= 0 || size > maxBytes) {
    try {
      await del(blobPathname)
    } catch {}
    return NextResponse.json({ error: '文件大小超限' }, { status: 400 })
  }

  try {
    const record = await createMediaRecord(phone, {
      id,
      type,
      fileName,
      mimeType,
      size,
      blobUrl,
      blobPathname,
      ttlMs: MEDIA_TTL_MS,
    })
    return NextResponse.json({ record })
  } catch (e) {
    console.error('创建媒体记录失败:', e)
    return NextResponse.json({ error: '创建媒体记录失败' }, { status: 500 })
  }
}
