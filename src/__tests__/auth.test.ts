import { describe, it, expect, afterEach } from 'vitest'
import { isValidPhone, isAllowedPhone, getPhoneFromRequest, USER_TTL_SECONDS } from '@/lib/auth'

const ALLOWED = '13800138000'
const OLD_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...OLD_ENV }
})

describe('isValidPhone', () => {
  it('标准手机号返回 true', () => {
    expect(isValidPhone('13800138000')).toBe(true)
    expect(isValidPhone('15912345678')).toBe(true)
    expect(isValidPhone('18900001111')).toBe(true)
  })

  it('新号段（19x）返回 true', () => {
    expect(isValidPhone('19912345678')).toBe(true)
  })

  it('非字符串类型返回 false', () => {
    expect(isValidPhone(13800138000)).toBe(false)
    expect(isValidPhone(null)).toBe(false)
    expect(isValidPhone(undefined)).toBe(false)
    expect(isValidPhone({})).toBe(false)
    expect(isValidPhone([])).toBe(false)
  })

  it('空字符串返回 false', () => {
    expect(isValidPhone('')).toBe(false)
  })

  it('位数不足或超出返回 false', () => {
    expect(isValidPhone('1380013800')).toBe(false)   // 10 位
    expect(isValidPhone('133800138000')).toBe(false) // 12 位
  })

  it('不以 1 开头返回 false', () => {
    expect(isValidPhone('23800138000')).toBe(false)
  })

  it('第二位为 0-2 返回 false', () => {
    expect(isValidPhone('10012345678')).toBe(false)
    expect(isValidPhone('11001234567')).toBe(false)
    expect(isValidPhone('12001234567')).toBe(false)
  })

  // 边界：1[3-9] 合法区间
  it('第二位 3（下边界）返回 true', () => {
    expect(isValidPhone('13000000000')).toBe(true)
  })

  it('第二位 9（上边界）返回 true', () => {
    expect(isValidPhone('19999999999')).toBe(true)
  })
})

describe('isAllowedPhone', () => {
  it('环境变量未配置时返回 false', () => {
    delete process.env.ALLOWED_PHONE
    expect(isAllowedPhone(ALLOWED)).toBe(false)
  })

  it('环境变量配置但不匹配返回 false', () => {
    process.env.ALLOWED_PHONE = '13900001111'
    expect(isAllowedPhone(ALLOWED)).toBe(false)
  })

  it('环境变量配置且匹配返回 true', () => {
    process.env.ALLOWED_PHONE = ALLOWED
    expect(isAllowedPhone(ALLOWED)).toBe(true)
  })

  it('传入无效手机号直接返回 false（不检查环境变量）', () => {
    process.env.ALLOWED_PHONE = ALLOWED
    expect(isAllowedPhone('123')).toBe(false)
    expect(isAllowedPhone(123)).toBe(false)
  })
})

describe('getPhoneFromRequest', () => {
  it('header 有效且允许时返回手机号', () => {
    process.env.ALLOWED_PHONE = ALLOWED
    const req = new Request('http://localhost', {
      headers: { 'x-user-phone': ALLOWED },
    })
    expect(getPhoneFromRequest(req)).toBe(ALLOWED)
  })

  it('header 有效但不允许时返回 null', () => {
    process.env.ALLOWED_PHONE = '13900001111'
    const req = new Request('http://localhost', {
      headers: { 'x-user-phone': ALLOWED },
    })
    expect(getPhoneFromRequest(req)).toBeNull()
  })

  it('header 不存在时返回 null', () => {
    process.env.ALLOWED_PHONE = ALLOWED
    const req = new Request('http://localhost')
    expect(getPhoneFromRequest(req)).toBeNull()
  })

  it('header 值无效时返回 null', () => {
    process.env.ALLOWED_PHONE = ALLOWED
    const req = new Request('http://localhost', {
      headers: { 'x-user-phone': 'not-a-phone' },
    })
    expect(getPhoneFromRequest(req)).toBeNull()
  })
})

describe('USER_TTL_SECONDS', () => {
  it('等于 7 天', () => {
    expect(USER_TTL_SECONDS).toBe(7 * 24 * 60 * 60)
  })
})
