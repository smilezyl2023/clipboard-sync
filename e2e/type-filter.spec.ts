import { test, expect } from '@playwright/test'
import { mockLogin, login, E2E_TEXT_RECORD, E2E_TEXT_RECORD_2, mockRecordsList } from './helpers'

test.describe('T-2.1.2 类型筛选标签', () => {
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
      id: 'e2e-rec-image-2',
      timestamp: 1_700_000_000_005,
      preview: 'photo.jpg',
      type: 'image' as const,
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 80000,
      blobUrl: 'https://example.com/photo.jpg',
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

  test('VC-2: 点击「文本」标签仅显示文本记录', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    await expect(page.locator('.record-item')).toHaveCount(5)

    await page.getByRole('tab', { name: '文本' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)
    await expect(page.locator('.record-content').filter({ hasText: 'E2E' })).toHaveCount(2)
  })

  test('VC-3: 点击「图片」标签仅显示图片记录', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    await page.getByRole('tab', { name: '图片' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)
    await expect(page.locator('.record-content').filter({ hasText: 'screenshot.png' })).toBeVisible()
    await expect(page.locator('.record-content').filter({ hasText: 'photo.jpg' })).toBeVisible()
  })

  test('VC-4: 点击「文件」标签仅显示文件记录', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    await page.getByRole('tab', { name: '文件' }).click()
    await expect(page.locator('.record-item')).toHaveCount(1)
    await expect(page.locator('.record-content').first()).toContainText('报告文档.pdf')
  })

  test('VC-1 & VC-5: 「全部」标签显示所有记录 + 切换回全部恢复', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 先切换到文本
    await page.getByRole('tab', { name: '文本' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)

    // 切回全部
    await page.getByRole('tab', { name: '全部' }).click()
    await expect(page.locator('.record-item')).toHaveCount(5)
  })

  test('VC-6: 类型筛选 + 搜索组合 — 先筛选再搜索', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 先筛选图片
    await page.getByRole('tab', { name: '图片' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)

    // 在图片内搜索关键词
    await page.getByLabel('搜索历史记录').fill('photo')
    await expect(page.locator('.record-item')).toHaveCount(1)
    await expect(page.locator('.record-content').first()).toContainText('photo.jpg')
  })

  test('VC-7: 类型筛选 + 搜索组合 — 先搜索再筛选', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 先搜索
    await page.getByLabel('搜索历史记录').fill('E2E')
    await expect(page.locator('.record-item')).toHaveCount(2)

    // 在搜索结果中筛选文本类型（应该仍是这些文本记录）
    await page.getByRole('tab', { name: '文本' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)

    // 切换到图片类型（搜索结果中无图片，应为空）
    await page.getByRole('tab', { name: '图片' }).click()
    await expect(page.locator('.record-item')).toHaveCount(0)
    await expect(page.getByText('未找到匹配的记录')).toBeVisible()
  })

  test('VC-8: 清空搜索后保留类型筛选', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 先筛选文本，再搜索
    await page.getByRole('tab', { name: '文本' }).click()
    await page.getByLabel('搜索历史记录').fill('E2E 单条删除')
    await expect(page.locator('.record-item')).toHaveCount(1)

    // 清空搜索
    await page.getByLabel('搜索历史记录').fill('')
    // 仍保留文本筛选
    await expect(page.locator('.record-item')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: '文本' })).toHaveAttribute('aria-selected', 'true')
  })

  test('VC-9: 筛选结果为空时显示空状态', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // 搜索一个不存在的关键词
    await page.getByLabel('搜索历史记录').fill('xyz不存在的')

    // 再筛选文件（搜索结果中无文件）
    await page.getByRole('tab', { name: '文件' }).click()
    await expect(page.locator('.record-item')).toHaveCount(0)
    await expect(page.getByText('未找到匹配的记录')).toBeVisible()
  })

  test('VC-10: 纯类型筛选无结果时显示类型专用空状态', async ({ page }) => {
    // 使用只有文本的记录，确保无图片/文件
    const textOnlyRecords = [E2E_TEXT_RECORD, E2E_TEXT_RECORD_2]
    await mockLogin(page)
    await mockRecordsList(page, textOnlyRecords)
    await login(page)

    // 点击「图片」标签，无搜索词
    await page.getByRole('tab', { name: '图片' }).click()
    await expect(page.locator('.record-item')).toHaveCount(0)
    await expect(page.getByText('暂无图片记录')).toBeVisible()
    await expect(page.getByText('上传图片后在此查看')).toBeVisible()

    // 点击「文件」标签
    await page.getByRole('tab', { name: '文件' }).click()
    await expect(page.locator('.record-item')).toHaveCount(0)
    await expect(page.getByText('暂无文件记录')).toBeVisible()
    await expect(page.getByText('上传文件后在此查看')).toBeVisible()

    // 切回「全部」恢复正常
    await page.getByRole('tab', { name: '全部' }).click()
    await expect(page.locator('.record-item')).toHaveCount(2)
  })

  test('VC-13: 标签 aria 属性正确', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, records)
    await login(page)

    // role="tablist" 存在
    await expect(page.getByRole('tablist', { name: '按类型筛选' })).toBeVisible()

    // 初始「全部」为选中状态
    await expect(page.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: '文本' })).toHaveAttribute('aria-selected', 'false')

    // 点击后切换
    await page.getByRole('tab', { name: '文本' }).click()
    await expect(page.getByRole('tab', { name: '文本' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'false')
  })
})
