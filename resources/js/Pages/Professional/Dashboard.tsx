import { Head } from '@inertiajs/react';

import { MiniIcon, StatCard } from '../../Components/Dashboard/StatCard';
import { Badge } from '../../Components/ui/Badge';
import { Button } from '../../Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../Components/ui/Card';
import { ProfessionalLayout } from '../../Layouts/ProfessionalLayout';
import { formatCurrency } from '../../lib/formatters';

const opportunities = [
    { title: 'Instalação de quadro eléctrico', location: 'Maputo · 3 km', budget: '8.000–12.000 MT', age: 'Há 20 min' },
    { title: 'Revisão de instalação residencial', location: 'Matola · 8 km', budget: 'Negociável', age: 'Há 1 hora' },
    { title: 'Montagem de sistema solar', location: 'Marracuene · 18 km', budget: '25.000–40.000 MT', age: 'Hoje' },
];

export default function ProfessionalDashboard() {
    return (
        <ProfessionalLayout title="Visão geral" description="Acompanhe oportunidades, propostas e o desempenho do seu negócio." actions={<Button size="sm">Encontrar trabalhos</Button>}>
            <Head title="Área profissional" />
            <div className="grid gap-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Novas oportunidades" value="24" detail="8 perto de si" icon={<MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" />} />
                    <StatCard label="Propostas activas" value="7" detail="2 vistas hoje" tone="violet" icon={<MiniIcon path="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" />} />
                    <StatCard label="Contratos em curso" value="4" detail="Todos dentro do prazo" tone="green" icon={<MiniIcon path="M4 7h16v13H4zM8 7V4h8v3" />} />
                    <StatCard label="Receita este mês" value={formatCurrency(42800)} detail="+18% face ao mês anterior" tone="amber" icon={<MiniIcon path="M4 18 9 12l4 3 7-9M16 6h4v4" />} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.75fr)]">
                    <Card>
                        <CardHeader><div><CardTitle>Oportunidades para si</CardTitle><CardDescription>Pedidos recentes compatíveis com o seu perfil.</CardDescription></div><Button variant="ghost" size="sm">Ver todas</Button></CardHeader>
                        <CardContent className="grid gap-3">
                            {opportunities.map((opportunity) => (
                                <article key={opportunity.title} className="grid gap-4 rounded-xl border border-slate-100 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4l3 2" /></div>
                                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{opportunity.title}</h3><Badge variant="green">Novo</Badge></div><p className="mt-1 text-sm text-slate-500">{opportunity.location} · {opportunity.age}</p><p className="mt-2 text-sm font-semibold text-slate-800">{opportunity.budget}</p></div>
                                    <Button variant="outline" size="sm">Ver pedido</Button>
                                </article>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        <Card>
                            <CardHeader><div><CardTitle>Força do perfil</CardTitle><CardDescription>Complete o perfil para receber mais convites.</CardDescription></div><span className="text-sm font-bold text-brand-700">82%</span></CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[82%] rounded-full bg-brand-600" /></div>
                                <ul className="grid gap-2 text-sm text-slate-600"><li className="flex items-center gap-2 text-emerald-700">✓ Identidade verificada</li><li className="flex items-center gap-2 text-emerald-700">✓ Competências adicionadas</li><li className="flex items-center gap-2">○ Adicione mais trabalhos ao portefólio</li></ul>
                                <Button variant="secondary" className="w-full">Completar perfil</Button>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-950 text-white"><CardContent><Badge className="bg-white/10 text-white ring-white/10">Dica ProConnect</Badge><h3 className="mt-4 font-semibold">Responda mais rápido</h3><p className="mt-2 text-sm leading-6 text-slate-300">Profissionais que respondem nas primeiras duas horas têm mais hipóteses de contratação.</p></CardContent></Card>
                    </div>
                </section>
            </div>
        </ProfessionalLayout>
    );
}
