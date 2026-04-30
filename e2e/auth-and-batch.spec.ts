import { test, expect } from '@playwright/test'
import { mockRecordsList } from './helpers'

test.describe('登录失败', () => {
  test('无效手机号格式 → 客户端校验拦截，显示错误提示', async ({ page }) => {
    // 客户端 PHONE_RE 校验先于 API 调用，"12345" 不会触发网络请求
    await page.goto('/')
    await page.getByLabel('手机号').fill('12345')
    await page.getByRole('button', { name: '进入' }).click()

    // 客户端校验错误
    const errorEl = page.locator('.auth-error')
    await expect(errorEl).toBeVisible()
    await expect(errorEl).toHaveText('请输入有效的 11 位中国大陆手机号')
    await expect(errorEl).toHaveAttribute('role', 'alert')

    // 输入框关联了错误描述
    await expect(page.getByLabel('手机号')).toHaveAttribute('aria-describedby', 'auth-error')

    // 仍然停留在登录界面
    await expect(page.getByLabel('手机号')).toBeVisible()
    await expect(page.getByRole('button', { name: '进入' })).toBeVisible()
  })

  test('未授权手机号 → 显示无权限提示', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: '该手机号无访问权限' }),
      })
    })

    await page.goto('/')
    await page.getByLabel('手机号').fill('13900139000')
    await page.getByRole('button', { name: '进入' }).click()

    await expect(page.locator('.auth-error')).toHaveText('该手机号无访问权限')

    // 仍然停留在登录界面
    await expect(page.getByLabel('手机号')).toBeVisible()
  })

  test('登录接口 500 → 显示登录失败', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '登录失败' }),
      })
    })

    await page.goto('/')
    await page.getByLabel('手机号').fill('13800138000')
    await page.getByRole('button', { name: '进入' }).click()

    await expect(page.locator('.auth-error')).toHaveText('登录失败')
    await expect(page.getByLabel('手机号')).toBeVisible()
  })

  test('修正手机号后错误消失 → 登录成功', async ({ page }) => {
    let callCount = 0
    await page.route('**/api/auth/login', async route => {
      if (route.request().method() !== 'POST') {
        await route.fallback()
        return
      }
      callCount++
      if (callCount === 1) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: '该手机号无访问权限' }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await mockRecordsList(page, [])

    await page.goto('/')
    // 使用客户端校验通过的手机号，但不在白名单
    await page.getByLabel('手机号').fill('13900139000')
    await page.getByRole('button', { name: '进入' }).click()

    await expect(page.locator('.auth-error')).toBeVisible()

    // 修正手机号重新提交
    await page.getByLabel('手机号').fill('13800138000')
    await page.getByRole('button', { name: '进入' }).click()

    // 登录成功 → 跳转到历史记录页
    await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()
  })
})
