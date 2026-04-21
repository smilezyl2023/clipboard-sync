import { test, expect } from '@playwright/test'
import { mockLogin, login } from './helpers'

test.describe('历史列表 loading / error / retry', () => {
  test('首次加载显示骨架，不出现「暂无同步记录」，加载完成后可区分空列表', async ({
    page,
  }) => {
    await mockLogin(page)
    await page.route('**/api/records', async route => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await new Promise(r => setTimeout(r, 1800))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ records: [], lastModified: 0 }),
      })
    })

    await login(page)

    await expect(page.locator('.record-skeleton')).toHaveCount(5, { timeout: 3000 })
    await expect(page.getByText('暂无同步记录')).toHaveCount(0)

    await expect(page.locator('.record-skeleton')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByText('暂无同步记录')).toBeVisible()
  })

  test('列表请求失败时显示错误与重试，重试成功后进入正常态', async ({ page }) => {
    await mockLogin(page)

    const failRecords = async (route: import('@playwright/test').Route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '模拟服务错误' }),
      })
    }
    const okRecords = async (route: import('@playwright/test').Route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ records: [], lastModified: 0 }),
      })
    }

    await page.route('**/api/records', failRecords)

    await login(page)

    const errorBanner = page.locator('.records-error-banner')
    await expect(errorBanner).toContainText('模拟服务错误')
    await expect(page.getByTestId('records-retry')).toBeVisible()
    await expect(page.getByText('暂无同步记录')).toHaveCount(0)

    await page.unroute('**/api/records', failRecords)
    await page.route('**/api/records', okRecords)

    const retryResponse = page.waitForResponse(
      r => r.url().includes('/api/records') && r.request().method() === 'GET',
      { timeout: 15_000 }
    )
    await page.getByTestId('records-retry').click()
    expect((await retryResponse).status()).toBe(200)

    await expect(errorBanner).toHaveCount(0)
    await expect(page.locator('.empty-title')).toHaveText('暂无同步记录')
  })
})
