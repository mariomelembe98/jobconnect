import { Head } from '@inertiajs/react';

import { DraftNotice, PublicBulletList, PublicContentSection, PublicPageHeader } from '../../Components/Public/PublicContent';
import { MarketplaceLayout } from '../../Layouts/MarketplaceLayout';

export default function TermsPage() {
    return (
        <MarketplaceLayout>
            <Head title="Termos de utilização" />

            <PublicPageHeader
                eyebrow="Informação legal"
                title="Termos de utilização"
                description="Condições gerais provisórias para a utilização do marketplace ProConnect."
                notice={<DraftNotice>Este conteúdo é um placeholder informativo, não foi revisto por assessoria jurídica e não constitui a versão final dos termos da plataforma.</DraftNotice>}
            />

            <div className="mx-auto max-w-5xl px-page sm:px-8">
                <PublicContentSection title="1. Funcionamento do marketplace">
                    <p>A ProConnect liga clientes que procuram serviços a profissionais que apresentam perfis e propostas. A plataforma facilita descoberta, comunicação, contratos, avaliações, denúncias e disputas.</p>
                    <p>A ProConnect não executa os serviços anunciados e não é empregadora, representante ou parceira comercial automática dos utilizadores.</p>
                </PublicContentSection>

                <PublicContentSection title="2. Responsabilidades dos utilizadores">
                    <PublicBulletList items={[
                        'Fornecer informação verdadeira, actualizada e suficiente para utilização da conta.',
                        'Proteger credenciais de acesso e comunicar utilização suspeita.',
                        'Respeitar outros utilizadores e não publicar conteúdo fraudulento, abusivo ou ilegal.',
                        'Utilizar denúncias e disputas de boa-fé.',
                    ]} />
                </PublicContentSection>

                <PublicContentSection title="3. Responsabilidades dos profissionais">
                    <PublicBulletList items={[
                        'Apresentar competências, experiência, disponibilidade e preços de forma clara.',
                        'Enviar documentos legítimos quando solicitar verificação.',
                        'Cumprir propostas e contratos aceites ou comunicar impedimentos atempadamente.',
                        'Executar serviços de acordo com a legislação aplicável e padrões profissionais adequados.',
                    ]} />
                </PublicContentSection>

                <PublicContentSection title="4. Limitações da plataforma">
                    <p>A plataforma não garante disponibilidade contínua, contratação, qualidade final do serviço, resultados financeiros ou ausência total de conflitos entre utilizadores.</p>
                    <p>Funcionalidades, limites e políticas podem ser ajustados durante as fases beta e de lançamento, mediante comunicação adequada.</p>
                </PublicContentSection>

                <PublicContentSection title="5. Disputas">
                    <p>Participantes de um contrato podem abrir uma disputa quando existir desacordo relevante. A equipa administrativa pode analisar descrições, mensagens e provas disponibilizadas.</p>
                    <p>O processo interno de disputa não substitui direitos legais nem o recurso às autoridades competentes.</p>
                </PublicContentSection>

                <PublicContentSection title="6. Suspensão e bloqueio de contas">
                    <p>A ProConnect pode suspender ou bloquear contas por fraude, abuso, riscos de segurança, incumprimento destes termos ou exigência legal. Contas suspensas ou bloqueadas não podem iniciar novas sessões nem utilizar APIs protegidas.</p>
                </PublicContentSection>

                <PublicContentSection title="7. Contacto">
                    <p>O endereço oficial para assuntos legais será publicado antes do lançamento público da plataforma.</p>
                </PublicContentSection>
            </div>
        </MarketplaceLayout>
    );
}
