import { expect, type Page } from '@playwright/test';

export const credentials = {
    client: {
        identifier: 'playwright.client@example.test',
        password: 'password123',
        dashboardPath: '/client',
    },
    professional: {
        identifier: 'playwright.professional@example.test',
        password: 'password123',
        dashboardPath: '/professional',
    },
};

export async function loginAs(page: Page, role: keyof typeof credentials): Promise<void> {
    const account = credentials[role];

    await page.goto('/login');
    await page.getByLabel('Email ou telefone').fill(account.identifier);
    await page.getByLabel('Palavra-passe').fill(account.password);
    await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
    await expect(page).toHaveURL(new RegExp(`${account.dashboardPath}$`));
}
