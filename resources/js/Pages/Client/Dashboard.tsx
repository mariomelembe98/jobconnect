import { Head } from '@inertiajs/react';

import { MiniIcon, StatCard } from '../../Components/Dashboard/StatCard';
import { Badge } from '../../Components/ui/Badge';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../Components/ui/Card';
import { ClientLayout } from '../../Layouts/ClientLayout';
import { formatCurrency } from '../../lib/formatters';

const requests = [
    { title: 'Instalação eléctrica residencial', category: 'Electricidade', proposals: 6, status: 'A receber propostas', tone: 'blue' as const },
    { title: 'Reparação de ar condicionado', category: 'Climatização', proposals: 3, status: 'Em progresso', tone: 'amber' as const },
];

const professionals = [
    { name: 'Amélia Chongo', trade: 'Electricista', rating: '4,9', initials: 'AC' },
    { name: 'Carlos Muianga', trade: 'Técnico de AVAC', rating: '4,8', initials: 'CM' },
    { name: 'Lídia Macamo', trade: 'Designer de interiores', rating: '4,9', initials: 'LM' },
];

export default function ClientDashboard() {
    return (
        <ClientLayout
            title="Visão geral"
            description="Acompanhe os seus pedidos e encontre profissionais de confiança."
            actions={<Button size="sm"><span className="text-lg leading-none">+</span><span className="hidden sm:inline">Novo pedido</span></Button>}
        >
            <Head title="Área do cliente" />
            <div className="grid gap-6">
                <section className="relative overflow-hidden rounded-2xl bg-brand-700 p-6 text-white shadow-elevated sm:p-8">
                    <div className="absolute -right-16 -top-24 size-72 rounded-full bg-brand-500/30" />
                    <div className="absolute right-24 top-10 size-32 rounded-full border border-white/10" />
                    <div className="relative max-w-2xl">
                        <Badge className="bg-white/15 text-white ring-white/20">Olá, Paulo</Badge>
                        <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Que serviço precisa hoje?</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-brand-100 sm:text-base">Publique o seu pedido e receba propostas de profissionais verificados na sua zona.</p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Button variant="outline" className="border-white bg-white text-brand-700 hover:bg-brand-50">Publicar pedido</Button>
                            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">Explorar profissionais</Button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Pedidos activos" value="3" detail="1 novo esta semana" icon={<MiniIcon path="M6 3h9l3 3v15H6zM9 11h6M9 15h6" />} />
                    <StatCard label="Propostas recebidas" value="12" detail="6 por analisar" tone="violet" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3M4 12h16" />} />
                    <StatCard label="Contratos activos" value="2" detail="Todos dentro do prazo" tone="green" icon={<MiniIcon path="m5 12 4 4L19 6" />} />
                    <StatCard label="Valor contratado" value={formatCurrency(18500)} detail="Nos últimos 30 dias" tone="amber" icon={<MiniIcon path="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
                    <Card>
                        <CardHeader>
                            <div><CardTitle>Pedidos recentes</CardTitle><CardDescription>Últimos pedidos e actividade das propostas.</CardDescription></div>
                            <Button variant="ghost" size="sm">Ver todos</Button>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {requests.map((request) => (
                                <article key={request.title} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm"><MiniIcon path="M6 3h9l3 3v15H6zM9 11h6" /></div>
                                    <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-slate-950">{request.title}</h3><p className="mt-1 text-xs text-slate-500">{request.category} · {request.proposals} propostas</p></div>
                                    <Badge variant={request.tone}>{request.status}</Badge>
                                    <Button variant="outline" size="sm">Detalhes</Button>
                                </article>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><div><CardTitle>Profissionais recomendados</CardTitle><CardDescription>Bem avaliados na sua zona.</CardDescription></div></CardHeader>
                        <CardContent className="grid gap-4">
                            {professionals.map((professional) => (
                                <div key={professional.name} className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">{professional.initials}</div>
                                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{professional.name}</p><p className="text-xs text-slate-500">{professional.trade}</p></div>
                                    <span className="text-sm font-semibold text-amber-600">★ {professional.rating}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </ClientLayout>
    );
}
