import { NextResponse } from 'next/server'
import { purgeExpiredMedia } from '@/lib/store'

// Vercel Cron 调用此端点时会自动带上 Authorization: Bearer $CRON_SECRET
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const phone = process.env.ALLOWED_PHONE
  if (!phone) {
    return NextResponse.json({ error: '未配置 ALLOWED_PHONE' }, { status: 500 })
  }

  const removed = await purgeExpiredMedia(phone)
  return NextResponse.json({ removed })
}
