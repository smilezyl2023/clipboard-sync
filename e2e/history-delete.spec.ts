import { test, expect } from '@playwright/test'
import {
  mockLogin,
  login,
  mockRecordsList,
  E2E_TEXT_RECORD,
  E2E_TEXT_RECORD_2,
  swipeLeftOnRecordRow,
} from './helpers'

test.describe('单条删除 · 桌面', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('点击行内删除 → Toast → 撤销恢复记录（无 DELETE 请求）', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])

    let deleteCalled = false
    await page.route('**/api/records/delete**', async route => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }
      deleteCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await login(page)

    await expect(page.locator('.record-swipe-outer')).toHaveCount(1)
    await expect(page.getByText('E2E 单条删除')).toBeVisible()

    // 点击删除 → 不再弹 confirm，直接进入延迟删除状态
    await page.getByRole('button', { name: '删除此条记录' }).click()

    // Toast "已删除" 出现 + 撤销按钮
    await expect(page.getByText('已删除')).toBeVisible()

    // 记录进入半透明 pendingDelete 状态
    await expect(page.locator('.pending-delete')).toHaveCount(1)

    // 点击撤销 → 恢复记录
    await page.locator('.toast-item').getByRole('button', { name: '撤销' }).click()

    // 恢复 Toast
    await expect(page.getByText('已恢复')).toBeVisible()

    // 记录恢复，没有发起 DELETE
    expect(deleteCalled).toBe(false)
    await expect(page.locator('.record-swipe-outer')).toHaveCount(1)
    await expect(page.locator('.pending-delete')).toHaveCount(0)
  })

  test('点击行内删除 → 等 5s → DELETE ?id= → 行消失', async ({ page }) => {
    await page.clock.install()

    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])

    let deletedId: string | null = null
    await page.route('**/api/records/delete**', async route => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }
      const url = new URL(route.request().url())
      deletedId = url.searchParams.get('id')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await login(page)

    await expect(page.locator('.record-swipe-outer')).toHaveCount(1)
    await expect(page.getByText('E2E 单条删除')).toBeVisible()

    await page.getByRole('button', { name: '删除此条记录' }).click()

    // Toast 出现
    await expect(page.getByText('已删除')).toBeVisible()

    // fast-forward 5 秒触发定时器
    await page.clock.fastForward(5000)

    expect(deletedId).toBe(E2E_TEXT_RECORD.id)
    await expect(page.locator('.record-swipe-outer')).toHaveCount(0)
    await expect(page.getByText('暂无同步记录')).toBeVisible()
  })
})

test.describe('单条删除 · 窄屏滑动', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })

  test('左滑露出删除 → 点击删除 → Toast → fast-forward → 行消失', async ({ page }) => {
    await page.clock.install()

    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD])

    let deletedId: string | null = null
    await page.route('**/api/records/delete**', async route => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }
      const url = new URL(route.request().url())
      deletedId = url.searchParams.get('id')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await login(page)

    const row = page.locator('.record-swipe-outer').first()
    await expect(row).toBeVisible()

    await swipeLeftOnRecordRow(row)

    await row.getByRole('button', { name: '删除此条记录' }).click()

    // Toast 出现
    await expect(page.getByText('已删除')).toBeVisible()

    // fast-forward 5 秒触发定时器
    await page.clock.fastForward(5000)

    expect(deletedId).toBe(E2E_TEXT_RECORD.id)
    await expect(page.locator('.record-swipe-outer')).toHaveCount(0)
    await expect(page.getByText('暂无同步记录')).toBeVisible()
  })
})

test.describe('批量删除 · 桌面', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('取消确认 → 不发起 DELETE', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD, E2E_TEXT_RECORD_2])

    let deleteCalls = 0
    await page.route('**/api/records/delete**', async route => {
      deleteCalls++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await login(page)
    await page.locator('.record-checkbox').first().check()
    await page.locator('.record-checkbox').nth(1).check()

    page.once('dialog', dialog => {
      void dialog.dismiss()
    })
    await page.getByTestId('batch-delete').click()

    expect(deleteCalls).toBe(0)
    await expect(page.locator('.record-swipe-outer')).toHaveCount(2)
  })

  test('确认删除 → 文案含数量与「条」→ body.ids → 行清空', async ({ page }) => {
    await mockLogin(page)
    await mockRecordsList(page, [E2E_TEXT_RECORD, E2E_TEXT_RECORD_2])

    let batchIds: string[] | null = null
    await page.route('**/api/records/delete**', async route => {
      if (route.request().method() !== 'DELETE') {
        await route.continue()
        return
      }
      const url = new URL(route.request().url())
      if (url.searchParams.get('id')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
        return
      }
      const body = (await route.request().postDataJSON()) as { ids?: string[] }
      batchIds = body.ids ?? null
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, deleted: batchIds?.length ?? 0 }),
      })
    })

    await login(page)
    await page.locator('.record-checkbox').first().check()
    await page.locator('.record-checkbox').nth(1).check()

    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('2')
      expect(dialog.message()).toContain('条')
      void dialog.accept()
    })
    await page.getByTestId('batch-delete').click()

    expect(batchIds).not.toBeNull()
    expect(batchIds!.sort()).toEqual([E2E_TEXT_RECORD.id, E2E_TEXT_RECORD_2.id].sort())
    await expect(page.locator('.record-swipe-outer')).toHaveCount(0)
    await expect(page.getByText('暂无同步记录')).toBeVisible()
    await expect(page.getByText('删除成功')).toBeVisible()
  })
})
