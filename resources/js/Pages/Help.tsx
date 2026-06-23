import { Head, Link } from '@inertiajs/react';

import { PublicContentSection, PublicPageHeader } from '../Components/Public/PublicContent';
import { MarketplaceLayout } from '../Layouts/MarketplaceLayout';

const faqs = [
    {
        question: 'Como publico um pedido de serviço?',
        answer: 'Crie uma conta de cliente, abra a opção “Publicar pedido” e informe o título, categoria, descrição, orçamento, localização e prazo.',
    },
    {
        question: 'Como escolho um profissional?',
        answer: 'Compare o perfil, experiência, verificação, avaliações, valor e prazo apresentados em cada proposta antes de aceitar.',
    },
    {
        question: 'Como funciona a verificação profissional?',
        answer: 'O profissional envia documentos para análise administrativa. Os ficheiros ficam privados e o perfil recebe um estado de verificação após a revisão.',
    },
    {
        question: 'O que devo fazer quando existe um problema?',
        answer: 'Use uma denúncia para comunicar abuso ou conteúdo inadequado. Abra uma disputa quando o problema estiver associado a um contrato.',
    },
];

export default function HelpPage() {
    return (
        <MarketplaceLayout>
            <Head title="Central de ajuda" />

            <PublicPageHeader
                eyebrow="Suporte ProConnect"
                title="Central de ajuda"
                description="Orientações para clientes e profissionais utilizarem o marketplace com clareza e segurança."
            />

            <div className="mx-auto max-w-5xl px-page sm:px-8">
                <PublicContentSection title="Perguntas frequentes">
                    <div className="grid gap-4 md:grid-cols-2">
                        {faqs.map((faq) => (
                            <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
                                <h3 className="font-semibold text-slate-950">{faq.question}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                            </article>
                        ))}
                    </div>
                </PublicContentSection>

                <PublicContentSection title="Como criar um pedido">
                    <ol className="grid gap-3">
                        <HelpStep number="1" title="Inicie sessão como cliente" description="Entre na sua conta e seleccione “Publicar pedido”." />
                        <HelpStep number="2" title="Descreva o serviço" description="Indique categoria, descrição, tipo de serviço, orçamento, localização e prazo." />
                        <HelpStep number="3" title="Confirme e acompanhe" description="Depois da publicação, acompanhe propostas e notificações na área do cliente." />
                    </ol>
                    <Link href="/login" className="w-fit font-semibold text-brand-700 hover:text-brand-800">Entrar para publicar um pedido</Link>
                </PublicContentSection>

                <PublicContentSection title="Como profissionais enviam propostas">
                    <p>O profissional deve criar o perfil, seleccionar categorias e competências e procurar oportunidades na área profissional.</p>
                    <p>Na página do pedido, pode indicar o valor, o prazo de entrega e uma mensagem explicando a abordagem proposta. A proposta pode ser retirada enquanto estiver pendente, quando permitido.</p>
                </PublicContentSection>

                <PublicContentSection title="Verificação profissional">
                    <p>A verificação ajuda clientes a identificar profissionais cujos documentos foram analisados pela equipa administrativa.</p>
                    <p>Documentos de identificação, NUIT e certificados não são públicos. São guardados em armazenamento privado e disponibilizados apenas ao proprietário e a administradores autorizados.</p>
                </PublicContentSection>

                <PublicContentSection title="Disputas e denúncias">
                    <p><strong className="text-slate-950">Denúncias</strong> servem para comunicar fraude, abuso, perfis falsos, spam ou conteúdo inadequado.</p>
                    <p><strong className="text-slate-950">Disputas</strong> estão ligadas a contratos e permitem apresentar uma descrição, provas e mensagens para análise administrativa.</p>
                </PublicContentSection>

                <PublicContentSection title="Contactar suporte">
                    <div className="flex flex-col items-start gap-3 rounded-lg bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-950">Precisa de ajuda adicional?</h3>
                            <p className="mt-1 text-sm text-slate-600">O canal oficial de suporte será disponibilizado antes do lançamento público.</p>
                        </div>
                        <button type="button" disabled className="h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white opacity-60">
                            Contactar suporte, em breve
                        </button>
                    </div>
                </PublicContentSection>
            </div>
        </MarketplaceLayout>
    );
}

function HelpStep({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <li className="flex gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{number}</span>
            <div>
                <h3 className="font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
        </li>
    );
}
