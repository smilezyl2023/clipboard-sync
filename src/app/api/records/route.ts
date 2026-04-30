import { NextResponse } from 'next/server'
import { getRecords } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_WINDOW_MS = 60 * 1000

export async function GET(request: Request) {
  const rl = checkRateLimit(request, 60, RATE_WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '无访问权限' }, { status: 401 })
  }

  try {
    const data = await getRecords(phone)
    return NextResponse.json(data)
  } catch (e) {
    console.error('获取记录失败:', e)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}
