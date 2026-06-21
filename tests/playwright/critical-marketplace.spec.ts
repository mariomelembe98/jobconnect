import { expect, test, type Browser } from '@playwright/test';

import { loginAs } from './helpers';

let serviceRequestId = 0;
let proposalId = 0;
let contractId = 0;
let conversationId = 0;

test.describe.serial('Critical marketplace journeys', () => {
    test('client creates service request', async ({ page }) => {
        await loginAs(page, 'client');

        await page.goto('/client/service-requests/create');
        await page.getByLabel('Título').fill('Instalação eléctrica urgente');
        await page.getByLabel('Categoria').selectOption({ label: 'Electricidade' });
        await page.getByLabel('Descrição').fill('Preciso de um electricista para rever a instalação e corrigir falhas no quadro principal.');
        await page.getByLabel('Tipo de serviço').selectOption('local');
        await page.getByLabel('Orçamento mínimo (MZN)').fill('1500');
        await page.getByLabel('Orçamento máximo (MZN)').fill('3000');
        await page.getByLabel('Tipo de orçamento').selectOption('fixed');
        await page.getByLabel('Província').selectOption({ label: 'Maputo Cidade' });
        await page.getByLabel('Cidade').selectOption({ label: 'KaMpfumo' });
        await page.getByLabel('Endereço').fill('Bairro Central');
        await page.getByLabel('Prazo').fill('2026-12-31T12:00');
        await page.getByRole('button', { name: 'Publicar pedido' }).click();

        await expect(page).toHaveURL(/\/client\/service-requests\/\d+$/);
        serviceRequestId = Number(new URL(page.url()).pathname.split('/').pop());
        expect(serviceRequestId).toBeGreaterThan(0);
        await expect(page.getByText('Instalação eléctrica urgente')).toBeVisible();
    });

    test('professional creates profile', async ({ page }) => {
        await loginAs(page, 'professional');

        await page.goto('/professional/onboarding');
        await page.getByLabel('Headline').fill('Electricista certificado em Maputo');
        await page.getByLabel('Bio').fill('Tenho experiência em instalações, manutenção e reparação eléctrica residencial.');
        await page.getByLabel('Anos de experiência').fill('8');
        await page.getByLabel('Preço base (MZN)').fill('2500');
        await page.getByLabel('Tipo de preço').selectOption('fixed');

        await page.getByRole('button', { name: 'Seguinte' }).click();
        await page.getByRole('button', { name: 'Electricidade' }).click();
        await page.getByRole('button', { name: 'Instalação eléctrica' }).click();

        await page.getByRole('button', { name: 'Seguinte' }).click();
        await page.getByLabel('Província').selectOption({ label: 'Maputo Cidade' });
        await page.getByLabel('Cidade').selectOption({ label: 'KaMpfumo' });
        await page.getByLabel('Endereço').fill('Avenida 24 de Julho');
        await page.getByRole('button', { name: 'Seguinte' }).click();
        await page.getByRole('button', { name: 'Seguinte' }).click();
        await page.getByRole('button', { name: 'Concluir e activar' }).click();

        await expect(page).toHaveURL(/\/professional$/);
        await page.goto('/professional/profile');
        await expect(page.getByText('Electricista certificado em Maputo')).toBeVisible();
    });

    test('professional submits proposal', async ({ page }) => {
        expect(serviceRequestId).toBeGreaterThan(0);
        await loginAs(page, 'professional');

        await page.goto(`/professional/jobs/${serviceRequestId}`);
        await page.getByLabel('Valor proposto (MZN)').fill('2750');
        await page.getByLabel('Prazo de entrega (dias)').fill('3');
        await page.getByLabel('Mensagem').fill('Posso fazer a vistoria ainda esta semana e entregar um trabalho limpo e documentado.');
        await page.getByRole('button', { name: 'Enviar proposta' }).click();

        await expect(page).toHaveURL(/\/professional\/proposals$/);
        await expect(page.getByText('Propostas enviadas')).toBeVisible();
    });

    test('client accepts proposal', async ({ page }) => {
        expect(serviceRequestId).toBeGreaterThan(0);
        await loginAs(page, 'client');

        await page.goto(`/client/service-requests/${serviceRequestId}`);
        await page.getByRole('button', { name: 'Aceitar proposta' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Aceitar proposta' }).click();

        await expect(page.getByText('Proposta aceite com sucesso.')).toBeVisible();

        const openChatLink = page.getByRole('link', { name: 'Abrir chat' }).first();
        await expect(openChatLink).toBeVisible();
        const href = await openChatLink.getAttribute('href');
        expect(href).toMatch(/\/conversations\/\d+/);
        conversationId = Number(href?.split('/').pop());
        expect(conversationId).toBeGreaterThan(0);

        await page.goto('/contracts');
        const contractLink = page.getByRole('link', { name: 'Ver detalhes' }).first();
        await contractLink.click();
        await expect(page).toHaveURL(/\/contracts\/\d+$/);
        contractId = Number(new URL(page.url()).pathname.split('/').pop());
        expect(contractId).toBeGreaterThan(0);
    });

    test('contract is created', async ({ page }) => {
        expect(contractId).toBeGreaterThan(0);
        await loginAs(page, 'client');

        await page.goto('/contracts');
        await expect(page.getByText('Instalação eléctrica urgente')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Ver detalhes' }).first()).toBeVisible();

        await page.goto(`/contracts/${contractId}`);
        await expect(page.getByText('Contrato #')).toBeVisible();
        await expect(page.getByText('Instalação eléctrica urgente')).toBeVisible();
    });

    test('contract opens chat', async ({ page }) => {
        expect(contractId).toBeGreaterThan(0);
        expect(conversationId).toBeGreaterThan(0);
        await loginAs(page, 'client');

        await page.goto(`/contracts/${contractId}`);
        await page.getByRole('link', { name: 'Abrir chat' }).click();

        await expect(page).toHaveURL(`/conversations/${conversationId}`);
        await expect(page.getByText('Ainda não existem mensagens')).toBeVisible();
    });

    test('message exchange works', async ({ browser }) => {
        expect(conversationId).toBeGreaterThan(0);

        const clientPage = await createAuthedPage(browser, 'client');
        await clientPage.goto(`/conversations/${conversationId}`);
        await clientPage.locator('textarea[name="message"]').fill('Olá, confirmei os detalhes do trabalho.');
        await clientPage.getByRole('button', { name: 'Enviar mensagem' }).click();
        await expect(clientPage.getByText('Mensagem enviada com sucesso.')).toBeVisible();
        await clientPage.context().close();

        const professionalPage = await createAuthedPage(browser, 'professional');
        await professionalPage.goto(`/conversations/${conversationId}`);
        await professionalPage.locator('textarea[name="message"]').fill('Recebido. Vou começar pela vistoria da instalação.');
        await professionalPage.getByRole('button', { name: 'Enviar mensagem' }).click();
        await expect(professionalPage.getByText('Mensagem enviada com sucesso.')).toBeVisible();
        await professionalPage.context().close();
    });

    test('contract completed', async ({ page }) => {
        expect(contractId).toBeGreaterThan(0);
        await loginAs(page, 'client');

        await page.goto(`/contracts/${contractId}`);
        await page.getByRole('button', { name: 'Concluir contrato' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Concluir contrato' }).click();

        await expect(page.getByText('Contrato concluído com sucesso.')).toBeVisible();
        await expect(page.getByText('Concluído')).toBeVisible({ timeout: 10000 });
    });

    test('review submitted', async ({ page }) => {
        expect(contractId).toBeGreaterThan(0);
        await loginAs(page, 'client');

        await page.goto(`/contracts/${contractId}`);
        await page.getByRole('button', { name: 'Avaliar serviço' }).click();
        await page.getByLabel('5 estrelas').click();
        await page.getByLabel('Comentário (opcional)').fill('Serviço rápido, profissional e com boa comunicação.');
        await page.getByRole('button', { name: 'Enviar avaliação' }).click();

        await expect(page.getByText('Avaliação enviada com sucesso.')).toBeVisible();
        await page.goto('/reviews/me');
        await expect(page.getByText('Serviço rápido, profissional e com boa comunicação.')).toBeVisible();
    });
});

async function createAuthedPage(browser: Browser, role: 'client' | 'professional') {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, role);
    return page;
}
