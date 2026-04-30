import { test, expect } from '@playwright/test'
import { mockLogin, login, E2E_TEXT_RECORD, E2E_TEXT_RECORD_2, mockRecordsList } from './helpers'

test.describe('T-2.1.1 搜索框 UI + 前端过滤', () => {
  const records = [
    E2E_TEXT_RECORD,
    E2E_TEXT_RECORD_2,
    {
      id: 'e2e-rec-image-1',
      timestamp: 1_700_000_000_002,
      preview: 'screenshot.png',
      type: 'image' as const,
      fileName: 'screenshot.png',
      mimeType: 'image/png',
      size: 50000,
      blobUrl: 'https://example.com/screenshot.png',
      expiresAt: Date.now() + 3 * 3600_000,
    },
    {
      id: 'e2e-rec-file-1',
      timestamp: 1_700_000_000_003,
      preview: '报告文档.pdf',
      type: 'file' as const,
      fileName: '报告文档.pdf',
      mimeType: 'application/pdf',
      size: 200000,
      blobUrl: 'https://example.com/report.pdf',
      expiresAt: Date.now() + 3 * 3600_000,
    },
  ]

  test('VC-1: 输入关键词实时过滤记录列表', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 初始显示全部 4 条
    await expect(page.locator('.record-item')).toHaveCount(4)

    // 搜索匹配 preview 的关键词
    await page.getByLabel('搜索历史记录').fill('E2E')
    await expect(page.locator('.record-item')).toHaveCount(2)
    await expect(page.locator('.record-content').filter({ hasText: 'E2E' })).toHaveCount(2)
  })

  test('VC-2: 搜索匹配 content 和 fileName 字段', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // content 匹配
    await page.getByLabel('搜索历史记录').fill('全文')
    await expect(page.locator('.record-item')).toHaveCount(2)

    // fileName 匹配（图片）
    await page.getByLabel('搜索历史记录').fill('screenshot')
    await expect(page.locator('.record-item')).toHaveCount(1)
    await expect(page.locator('.record-content').first()).toContainText('screenshot.png')

    // fileName 匹配（文件）
    await page.getByLabel('搜索历史记录').fill('报告')
    await expect(page.locator('.record-item')).toHaveCount(1)
    await expect(page.locator('.record-content').first()).toContainText('报告文档.pdf')
  })

  test('VC-5: 搜索词为空时显示全部记录、隐藏清除按钮和计数', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 先搜索
    const input = page.getByLabel('搜索历史记录')
    await input.fill('E2E')
    await expect(page.locator('.search-filter-clear')).toBeVisible()
    await expect(page.locator('.search-filter-count')).toBeVisible()

    // 清空后恢复
    await input.fill('')
    await expect(page.locator('.record-item')).toHaveCount(4)
    await expect(page.locator('.search-filter-clear')).toHaveCount(0)
    await expect(page.locator('.search-filter-count')).toHaveCount(0)
  })

  test('VC-6: 无匹配时显示空状态', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    await page.getByLabel('搜索历史记录').fill('xyz不存在的关键词')
    await expect(page.locator('.record-item')).toHaveCount(0)
    await expect(page.getByText('未找到匹配的记录')).toBeVisible()
    await expect(page.getByText('尝试其他关键词')).toBeVisible()
  })

  test('VC-7: 搜索结果显示匹配计数', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    await page.getByLabel('搜索历史记录').fill('E2E')
    await expect(page.locator('.search-filter-count')).toContainText('2/4')
  })

  test('VC-8: 无任何记录时显示原有空状态', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [])
    await login(page)

    await expect(page.getByText('暂无同步记录')).toBeVisible()
    await expect(page.getByText('在上方输入内容并点击同步按钮')).toBeVisible()
    await expect(page.getByText('未找到匹配的记录')).toHaveCount(0)
  })

  test('VC-4: 搜索不影响已选中状态', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 选中第一条
    await page.locator('.record-checkbox').first().check()
    await expect(page.locator('.record-item.selected')).toHaveCount(1)

    // 搜索后已选中状态保持
    await page.getByLabel('搜索历史记录').fill('E2E')
    await expect(page.locator('.record-item.selected')).toHaveCount(1)
    await expect(page.locator('.batch-bar')).toBeVisible()
  })

  test('VC-3: 上传中/失败的记录不受搜索过滤', async ({ page }) => {
    await mockLogin(page)
    // 注入含上传中和上传失败状态的记录
    await mockRecordsList(page, [
      ...records,
      { id: 'e2e-rec-uploading', timestamp: Date.now(), preview: 'uploading-file.bin', type: 'file', fileName: 'uploading-file.bin', uploading: true, uploadProgress: 45 },
      { id: 'e2e-rec-failed', timestamp: Date.now(), preview: 'failed-upload.zip', type: 'file', fileName: 'failed-upload.zip', uploading: false, uploadFailed: true },
    ])
    await login(page)

    // 输入不相关关键词，上传中/失败记录仍应显示
    await page.getByLabel('搜索历史记录').fill('xyz不存在的关键词')

    // 上传中记录可见
    await expect(page.locator('.record-content').filter({ hasText: 'uploading-file.bin' })).toBeVisible()
    // 上传失败记录可见
    await expect(page.locator('.record-content').filter({ hasText: 'failed-upload.zip' })).toBeVisible()
    // 其他不匹配记录被过滤
    await expect(page.locator('.record-item')).toHaveCount(2)
  })
})
