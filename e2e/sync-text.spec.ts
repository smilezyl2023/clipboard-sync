import { test, expect } from '@playwright/test'
import { mockLogin, login, mockRecordsList } from './helpers'

test.describe('文本同步创建流程', () => {
  test('输入文本 → 同步 → 列表出现新记录 → 点击加载回输入框', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [])

    await login(page)

    const textarea = page.locator('.textarea-input')
    const testContent = 'Hello E2E 同步测试'

    await textarea.fill(testContent)

    const createdRecord = {
      id: 'e2e-sync-text-1',
      timestamp: Date.now(),
      preview: testContent,
      content: testContent,
      type: 'text' as const,
    }

    await page.route('**/api/records/create', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ record: createdRecord }),
      })
    })

    // 文本过长 > 100 时 preview 会被截断，确保测试内容不被截断验证更可靠
    await page.getByRole('button', { name: '同步' }).click()

    // 验证输入框已清空
    await expect(textarea).toHaveValue('')

    // 验证新记录出现在列表中
    const recordContent = page.locator('.record-content').first()
    await expect(recordContent).toHaveText(testContent)

    // 验证 Toast 提示
    await expect(page.getByText('已同步到所有设备')).toBeVisible()

    // 点击记录 body 加载回输入框
    await page.locator('.record-body').first().click()
    await expect(textarea).toHaveValue(testContent)
  })

  test('空文本同步 → Toast 错误提示', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [])

    await login(page)

    // 不清空和输入，直接点同步（textarea 初始为空）
    await page.getByRole('button', { name: '同步' }).click()

    await expect(page.getByText('请输入要同步的内容')).toBeVisible()
  })

  test('同步后列表累积：新记录在前', async ({ page }) => {
    await mockLogin(page)
    const existingRecord = {
      id: 'e2e-existing',
      timestamp: 1_700_000_000_000,
      preview: '已有记录',
      content: '已有记录全文',
      type: 'text' as const,
    }
    await mockRecordsList(page, [existingRecord])

    await login(page)

    // 验证已有记录存在
    await expect(page.locator('.record-content').first()).toHaveText('已有记录')

    const newContent = '新同步的内容'
    const newRecord = {
      id: 'e2e-new-sync',
      timestamp: Date.now(),
      preview: newContent,
      content: newContent,
      type: 'text' as const,
    }

    await page.route('**/api/records/create', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ record: newRecord }),
      })
    })

    await page.locator('.textarea-input').fill(newContent)
    await page.getByRole('button', { name: '同步' }).click()

    // 新记录应该在最前面
    await expect(page.locator('.record-content').first()).toHaveText(newContent)
    // 已有记录在第二位
    await expect(page.locator('.record-content').nth(1)).toHaveText('已有记录')
  })
})
