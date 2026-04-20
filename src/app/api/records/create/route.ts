import { NextResponse } from 'next/server'
import { createRecord } from '@/lib/store'
import { getPhoneFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  const phone = getPhoneFromRequest(request)
  if (!phone) {
    return NextResponse.json({ error: '无访问权限' }, { status: 401 })
  }

  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const record = await createRecord(phone, content.trim())
    return NextResponse.json({ record })
  } catch (error) {
    console.error('创建记录失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
