import { NextResponse } from 'next/server'
import { createRecord } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_WINDOW_MS = 60 * 1000

export async function POST(request: Request) {
  const rl = checkRateLimit(request, 60, RATE_WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }

  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '无访问权限' }, { status: 401 })
  }

  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: '内容超过 10000 字符限制' }, { status: 400 })
    }

    const record = await createRecord(phone, content.trim())
    return NextResponse.json({ record })
  } catch (error) {
    console.error('创建记录失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
