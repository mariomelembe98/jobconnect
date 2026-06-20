import { Head } from '@inertiajs/react';

import { MiniIcon, StatCard } from '../../Components/Dashboard/StatCard';
import { Badge } from '../../Components/ui/Badge';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../Components/ui/Card';
import { AdminLayout } from '../../Layouts/AdminLayout';
import { formatNumber } from '../../lib/formatters';

const verifications = [
    { name: 'Amélia Chongo', specialty: 'Electricidade', submitted: 'Hoje, 09:42', initials: 'AC' },
    { name: 'Mateus Baloi', specialty: 'Canalização', submitted: 'Ontem, 16:18', initials: 'MB' },
    { name: 'Celina Uamusse', specialty: 'Contabilidade', submitted: 'Ontem, 11:05', initials: 'CU' },
];

export default function AdminDashboard() {
    return (
        <AdminLayout title="Painel administrativo" description="Visão global da actividade e operações da plataforma." actions={<Button variant="outline" size="sm">Exportar resumo</Button>}>
            <Head title="Administração" />
            <div className="grid gap-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Utilizadores" value={formatNumber(2846)} detail="+124 este mês" icon={<MiniIcon path="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />} />
                    <StatCard label="Profissionais" value={formatNumber(742)} detail="68% verificados" tone="violet" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3M12 12v4" />} />
                    <StatCard label="Pedidos activos" value={formatNumber(386)} detail="+9% nesta semana" tone="green" icon={<MiniIcon path="M6 3h9l3 3v15H6zM9 11h6M9 15h6" />} />
                    <StatCard label="Itens pendentes" value="24" detail="12 verificações · 8 denúncias" tone="amber" icon={<MiniIcon path="M12 9v4M12 17h.01M10.3 4.3 2.7 18a2 2 0 0 0 1.75 3h15.1a2 2 0 0 0 1.75-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.7fr)]">
                    <Card>
                        <CardHeader><div><CardTitle>Verificações pendentes</CardTitle><CardDescription>Profissionais que aguardam validação documental.</CardDescription></div><Button variant="ghost" size="sm">Ver fila</Button></CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-[42rem] text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Profissional</th><th className="px-5 py-3">Área</th><th className="px-5 py-3">Submetido</th><th className="px-5 py-3 text-right">Acção</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {verifications.map((verification) => (
                                        <tr key={verification.name} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">{verification.initials}</span><span className="font-semibold text-slate-900">{verification.name}</span></div></td>
                                            <td className="px-5 py-4 text-slate-600">{verification.specialty}</td><td className="px-5 py-4 text-slate-500">{verification.submitted}</td><td className="px-5 py-4 text-right"><Button variant="outline" size="sm">Analisar</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><div><CardTitle>Operações</CardTitle><CardDescription>Estado das filas de moderação.</CardDescription></div></CardHeader>
                        <CardContent className="grid gap-5">
                            {[
                                { label: 'Verificações', value: 12, total: 20, color: 'bg-brand-500' },
                                { label: 'Denúncias', value: 8, total: 20, color: 'bg-amber-500' },
                                { label: 'Disputas', value: 4, total: 20, color: 'bg-violet-500' },
                            ].map((item) => (
                                <div key={item.label} className="grid gap-2">
                                    <div className="flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{item.label}</span><span className="font-semibold text-slate-950">{item.value}</span></div>
                                    <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / item.total) * 100}%` }} /></div>
                                </div>
                            ))}
                            <div className="rounded-xl bg-emerald-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-900">Sistema operacional</p><p className="mt-1 text-xs text-emerald-700">Todos os serviços estão disponíveis.</p></div><Badge variant="green">Online</Badge></div></div>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader><div><CardTitle>Actividade recente</CardTitle><CardDescription>Últimos eventos administrativos relevantes.</CardDescription></div></CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                        {[
                            ['Novo profissional registado', 'Há 8 minutos', 'blue'],
                            ['Disputa atribuída a um moderador', 'Há 24 minutos', 'violet'],
                            ['Denúncia resolvida', 'Há 41 minutos', 'green'],
                        ].map(([title, time, tone]) => <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><Badge variant={tone as 'blue' | 'violet' | 'green'}>{time}</Badge><p className="mt-3 text-sm font-semibold text-slate-900">{title}</p></div>)}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
