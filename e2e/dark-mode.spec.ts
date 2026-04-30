import { test, expect } from '@playwright/test';

test.describe('T-2.2.1 深色模式 CSS 变量 + 系统偏好检测', () => {
  test('VC-1: 系统偏好 dark → data-theme="dark"', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');
    await context.close();
  });

  test('VC-2: 系统偏好 light → data-theme="light"', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('light');
    await context.close();
  });

  test('VC-3: 运行时切换 colorScheme → data-theme 实时更新', async ({ page }) => {
    await page.goto('/');
    // 初始 light
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // 切换到 dark
    await page.emulateMedia({ colorScheme: 'dark' });
    // matchMedia 事件需要微任务 tick
    await page.waitForTimeout(100);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // 切回 light
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('VC-4: 深色模式下 CSS 变量值不同于浅色模式', async ({ browser }) => {
    // Light mode
    const lightCtx = await browser.newContext({ colorScheme: 'light' });
    const lightPage = await lightCtx.newPage();
    await lightPage.goto('/');
    const lightBg = await lightPage.locator('html').evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    );

    // Dark mode
    const darkCtx = await browser.newContext({ colorScheme: 'dark' });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto('/');
    const darkBg = await darkPage.locator('html').evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    );

    expect(lightBg).not.toBe(darkBg);
    expect(darkBg).toBe('220 15% 6%');
    expect(lightBg).toBe('0 0% 100%');

    const darkFg = await darkPage.locator('html').evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
    );
    expect(darkFg).toBe('220 20% 90%');

    await lightCtx.close();
    await darkCtx.close();
  });
});
