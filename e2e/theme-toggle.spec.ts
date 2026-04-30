import { test, expect } from '@playwright/test'
import { mockLogin, login, E2E_TEXT_RECORD, mockRecordsList } from './helpers'

test.describe('T-2.2.2 深色模式切换按钮 + localStorage 记忆', () => {
  test('VC-1: 无 localStorage + 系统 dark → data-theme="dark"', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
    await page.reload()
    const theme = await page.locator('html').getAttribute('data-theme')
    expect(theme).toBe('dark')
    await context.close()
  })

  test('VC-2: 无 localStorage + 系统 light → data-theme="light"', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
    await page.reload()
    const theme = await page.locator('html').getAttribute('data-theme')
    expect(theme).toBe('light')
    await context.close()
  })

  test('VC-3: 点击切换按钮 → data-theme 切换', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])
    await login(page)

    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
    await page.reload()
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()

    const initial = await page.locator('html').getAttribute('data-theme')
    const toggle = page.locator('.theme-toggle')

    await toggle.click()
    const afterClick = await page.locator('html').getAttribute('data-theme')
    expect(afterClick).not.toBe(initial)

    await toggle.click()
    const afterSecondClick = await page.locator('html').getAttribute('data-theme')
    expect(afterSecondClick).toBe(initial)
  })

  test('VC-4: 点击切换 → localStorage 写入对应值', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])
    await login(page)

    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
    await page.reload()
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()

    const toggle = page.locator('.theme-toggle')
    await toggle.click()
    const stored = await page.evaluate(() => localStorage.getItem('clipboard_sync_theme'))
    expect(stored).toBeTruthy()
    const current = await page.locator('html').getAttribute('data-theme')
    expect(stored).toBe(current)
  })

  test('VC-5: 刷新后保持 localStorage 偏好', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('clipboard_sync_theme', 'dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await page.reload()
    const theme = await page.locator('html').getAttribute('data-theme')
    expect(theme).toBe('dark')
    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
  })

  test('VC-6: 切换后 CSS 变量变化', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])
    await login(page)

    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
    await page.reload()
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()

    const getBg = () =>
      page.locator('html').evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
      )

    const bgBefore = await getBg()
    await page.locator('.theme-toggle').click()
    const bgAfter = await getBg()
    expect(bgAfter).not.toBe(bgBefore)
  })

  test('VC-7: 手动设置后系统偏好变化不覆盖', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])
    await login(page)

    await page.evaluate(() => {
      localStorage.setItem('clipboard_sync_theme', 'dark')
    })
    await page.reload()
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(200)

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
  })

  test('VC-9: localStorage 非法值 → 回退系统偏好', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('clipboard_sync_theme', 'invalid')
    })
    await page.reload()

    const theme = await page.locator('html').getAttribute('data-theme')
    expect(theme === 'light' || theme === 'dark').toBe(true)
    await page.evaluate(() => localStorage.removeItem('clipboard_sync_theme'))
  })
})
