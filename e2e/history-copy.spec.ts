import { test, expect } from '@playwright/test'
import { mockLogin, login, mockRecordsList, E2E_TEXT_RECORD } from './helpers'

test.describe('行内复制 · 桌面', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('点击复制 → 剪贴板为全文（content）', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:3000',
    })
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])

    await login(page)

    await page
      .locator('.record-swipe-outer')
      .getByRole('button', { name: '复制到剪贴板' })
      .click()

    await expect(page.getByText('已复制')).toBeVisible()
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip).toBe(E2E_TEXT_RECORD.content)
  })

  test('图片记录 → 剪贴板为 blobUrl', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:3000',
    })
    await mockLogin(page)
    const imgUrl = 'https://example.com/e2e-blob.png'
    await mockRecordsList(page, [
      {
        id: 'e2e-copy-img',
        timestamp: 1_700_000_000_002,
        preview: 'e2e.png',
        type: 'image' as const,
        blobUrl: imgUrl,
        fileName: 'e2e.png',
        mimeType: 'image/png',
        size: 1024,
      },
    ])

    await login(page)

    await page
      .locator('.record-swipe-outer')
      .getByRole('button', { name: '复制到剪贴板' })
      .click()

    await expect(page.getByText('已复制链接')).toBeVisible()
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip).toBe(imgUrl)
  })
})
