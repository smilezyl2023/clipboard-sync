import { expect, type Locator, type Page } from '@playwright/test'

/** 使用 route 模拟 API，避免 E2E 依赖 Redis / ALLOWED_PHONE */
export async function mockLogin(page: Page) {
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })
}

export async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('手机号').fill('13800138000')
  await page.getByRole('button', { name: '进入' }).click()
  await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()
}

/** 一条文本记录（与 store Record 对齐） */
export const E2E_TEXT_RECORD = {
  id: 'e2e-rec-delete-1',
  timestamp: 1_700_000_000_000,
  preview: 'E2E 单条删除',
  type: 'text' as const,
  content: 'E2E 单条删除全文',
}

/** 第二条文本记录（批量删除等场景） */
export const E2E_TEXT_RECORD_2 = {
  id: 'e2e-rec-batch-2',
  timestamp: 1_700_000_000_001,
  preview: 'E2E 批量第二条',
  type: 'text' as const,
  content: 'E2E 批量第二条全文',
}

export async function mockRecordsList(page: Page, records: unknown[]) {
  await page.route('**/api/records', async route => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records,
        lastModified: E2E_TEXT_RECORD.timestamp,
      }),
    })
  })
}

/**
 * 在「左滑删除」容器上模拟横向 touch（与 Playwright Touch events 文档一致）。
 * 用于 max-width 639px 布局下行内滑动露出删除键。
 */
export async function swipeLeftOnRecordRow(row: Locator) {
  const { startX, endX, centerY } = await row.evaluate((el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    return { startX: cx + 35, endX: cx - 55, centerY: cy }
  })
  const touch = (clientX: number) => [
    { identifier: 0, clientX, clientY: centerY },
  ]
  await row.dispatchEvent('touchstart', {
    touches: touch(startX),
    changedTouches: touch(startX),
    targetTouches: touch(startX),
  })
  const steps = 10
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps
    const t = touch(x)
    await row.dispatchEvent('touchmove', {
      touches: t,
      changedTouches: t,
      targetTouches: t,
    })
  }
  await row.dispatchEvent('touchend', {
    touches: [],
    changedTouches: touch(endX),
    targetTouches: [],
  })
}
