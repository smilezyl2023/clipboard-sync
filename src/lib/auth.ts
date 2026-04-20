// 中国大陆手机号格式：1 开头，第二位 3-9，共 11 位
const PHONE_RE = /^1[3-9]\d{9}$/

// 用户数据保留 7 天（秒）
export const USER_TTL_SECONDS = 7 * 24 * 60 * 60

export function isValidPhone(phone: unknown): phone is string {
  return typeof phone === 'string' && PHONE_RE.test(phone)
}

// 单用户白名单：只允许 ALLOWED_PHONE 环境变量中的手机号
export function isAllowedPhone(phone: unknown): phone is string {
  if (!isValidPhone(phone)) return false
  const allowed = process.env.ALLOWED_PHONE
  return !!allowed && phone === allowed
}

export function getPhoneFromRequest(request: Request): string | null {
  const phone = request.headers.get('x-user-phone') ?? ''
  return isAllowedPhone(phone) ? phone : null
}
