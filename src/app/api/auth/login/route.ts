import { NextResponse } from 'next/server'
import { isAllowedPhone, isValidPhone } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: '请输入有效的 11 位手机号' },
        { status: 400 }
      )
    }

    if (!isAllowedPhone(phone)) {
      return NextResponse.json({ error: '该手机号无访问权限' }, { status: 403 })
    }

    return NextResponse.json({ success: true, phone })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
