import { Head } from '@inertiajs/react';

import { DraftNotice, PublicBulletList, PublicContentSection, PublicPageHeader } from '../../Components/Public/PublicContent';
import { MarketplaceLayout } from '../../Layouts/MarketplaceLayout';

export default function PrivacyPage() {
    return (
        <MarketplaceLayout>
            <Head title="Política de privacidade" />

            <PublicPageHeader
                eyebrow="Informação legal"
                title="Política de privacidade"
                description="Resumo provisório sobre o tratamento de dados pessoais na ProConnect."
                notice={<DraftNotice>Este conteúdo é um placeholder informativo, sujeito a revisão jurídica, técnica e regulatória antes do lançamento público.</DraftNotice>}
            />

            <div className="mx-auto max-w-5xl px-page sm:px-8">
                <PublicContentSection title="1. Dados recolhidos">
                    <PublicBulletList items={[
                        'Dados de conta, como nome, email, telefone e tipo de utilizador.',
                        'Dados de localização, como província, cidade e morada.',
                        'Informação profissional, portfólio, categorias, competências e disponibilidade.',
                        'Pedidos, propostas, contratos, mensagens, avaliações, denúncias e disputas.',
                        'Dados técnicos de segurança, incluindo endereço IP, agente do utilizador e registos de actividade.',
                    ]} />
                </PublicContentSection>

                <PublicContentSection title="2. Como os dados são utilizados">
                    <p>Os dados são utilizados para criar e gerir contas, ligar clientes e profissionais, operar contratos e conversas, enviar notificações, moderar a plataforma e proteger utilizadores.</p>
                    <p>Dados agregados podem apoiar métricas operacionais, melhoria do produto e prevenção de abuso.</p>
                </PublicContentSection>

                <PublicContentSection title="3. Documentos de verificação">
                    <p>Documentos como BI, NUIT e certificados são tratados como informação privada. Não são publicados no perfil nem expostos através de URLs públicas.</p>
                    <p>O acesso é limitado ao profissional proprietário e a administradores ou super administradores autorizados, através de download autenticado.</p>
                </PublicContentSection>

                <PublicContentSection title="4. Segurança">
                    <PublicBulletList items={[
                        'Rotas protegidas exigem autenticação e estado de conta activo.',
                        'Acções de risco estão sujeitas a limitação de frequência.',
                        'Acções críticas são registadas para auditoria.',
                        'Documentos sensíveis utilizam armazenamento privado.',
                    ]} />
                    <p>Nenhum sistema é completamente imune a incidentes. Os procedimentos formais de resposta e notificação serão definidos antes do lançamento público.</p>
                </PublicContentSection>

                <PublicContentSection title="5. Direitos dos utilizadores">
                    <p>Os utilizadores poderão solicitar acesso, correcção ou eliminação de dados quando aplicável, sujeito a obrigações legais, prevenção de fraude e conservação necessária de registos.</p>
                    <p>O processo formal para exercer estes direitos e os respectivos prazos será publicado na versão final desta política.</p>
                </PublicContentSection>

                <PublicContentSection title="6. Contacto">
                    <p>O contacto oficial do responsável por privacidade será disponibilizado antes do lançamento público da ProConnect.</p>
                </PublicContentSection>
            </div>
        </MarketplaceLayout>
    );
}
