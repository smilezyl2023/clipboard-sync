import { test, expect } from '@playwright/test'
import { mockLogin, login, mockRecordsList } from './helpers'

test.describe('文件上传流程', () => {
  test('选择图片 → 上传中 → 进度条 → 完成 → 列表显示缩略图', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [])

    // 延迟响应用于验证上传中状态
    await page.route('**/api/records/upload', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await new Promise((r) => setTimeout(r, 400))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'blob.generate-client-token',
          clientToken: 'mock_store_123_fake',
        }),
      })
    })

    // Mock Vercel Blob PUT（跨域请求 + 上传耗时模拟）
    await page.route(/vercel\.com\/api\/blob/, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT',
            'Access-Control-Allow-Headers': '*',
          },
        })
        return
      }
      if (route.request().method() !== 'PUT') {
        await route.continue()
        return
      }
      await new Promise((r) => setTimeout(r, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://mock.public.blob.vercel-storage.com/clipboard/test.png',
          downloadUrl:
            'https://mock.public.blob.vercel-storage.com/clipboard/test.png?download=1',
          pathname: 'clipboard/13800138000/mock-id/test.png',
          contentType: 'image/png',
          contentDisposition: 'inline; filename="test.png"',
        }),
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    })

    // Mock create-media 元数据写入
    await page.route('**/api/records/create-media', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          record: {
            id: 'mock-media-1',
            type: 'image',
            timestamp: Date.now(),
            preview: 'test.png',
            fileName: 'test.png',
            mimeType: 'image/png',
            size: 68,
            blobUrl:
              'https://mock.public.blob.vercel-storage.com/clipboard/test.png',
            blobPathname: 'clipboard/13800138000/mock-id/test.png',
            expiresAt: Date.now() + 3 * 60 * 60 * 1000,
          },
        }),
      })
    })

    await login(page)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/test.png')

    // 进度条出现（上传中状态）
    await expect(page.locator('[role="progressbar"]')).toBeVisible()
    await expect(page.getByText(/上传中/)).toBeVisible()

    // 上传完成：进度条消失，缩略图出现
    await expect(page.locator('[role="progressbar"]')).not.toBeVisible()
    await expect(page.locator('.record-thumb')).toBeVisible()
    await expect(page.locator('.record-content').first()).toContainText('test.png')
  })

  test('上传失败 → 显示上传失败 + 重试按钮', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [])

    // Mock upload 端点返回 400
    await page.route('**/api/records/upload', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: '无效的上传参数' }),
      })
    })

    await login(page)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/test.png')

    // 上传失败状态（记录行内，非 Toast）
    await expect(page.locator('.record-upload-failed')).toBeVisible()
    await expect(page.locator('.record-upload-failed')).toHaveText('上传失败')
    await expect(page.locator('.record-retry-btn')).toBeVisible()
    await expect(page.locator('.record-retry-btn')).toHaveText('重试')

    // 文件名仍显示在列表中
    await expect(page.locator('.record-content').first()).toContainText('test.png')
  })
})
