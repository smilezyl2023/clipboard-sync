import { NextResponse } from 'next/server'
import { getRecords } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '无访问权限' }, { status: 401 })
  }

  const data = await getRecords(phone)
  return NextResponse.json(data)
}
