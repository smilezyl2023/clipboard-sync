import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { deleteRecord, deleteRecords, type Record } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_WINDOW_MS = 60 * 1000

function blobPathsOf(records: Record[]): string[] {
  return records
    .filter(r => (r.type === 'image' || r.type === 'file') && r.blobPathname)
    .map(r => r.blobPathname as string)
}

async function cleanupBlobs(records: Record[]): Promise<void> {
  const paths = blobPathsOf(records)
  if (paths.length === 0) return
  try {
    await del(paths)
  } catch (err) {
    console.warn('删除 blob 失败（将由 cron 兜底清理）:', err)
  }
}

export async function DELETE(request: Request) {
  const rl = checkRateLimit(request, 60, RATE_WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '未登录或手机号无效' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const removed = await deleteRecord(phone, id)
      if (!removed) {
        return NextResponse.json({ error: '记录不存在' }, { status: 404 })
      }
      await cleanupBlobs([removed])
      return NextResponse.json({ success: true })
    }

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '无效的 IDs' }, { status: 400 })
    }

    const removed = await deleteRecords(phone, ids)
    await cleanupBlobs(removed)

    return NextResponse.json({ success: true, deleted: removed.length })
  } catch (error) {
    console.error('删除记录失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
