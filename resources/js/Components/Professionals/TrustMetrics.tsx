import { formatCurrency } from '../../lib/formatters';
import type { ProfessionalProfile } from '../../types';

export function TrustMetrics({ professional }: { professional: ProfessionalProfile }) {
    const metrics = [
        { label: 'Avaliação média', value: `★ ${Number(professional.average_rating).toFixed(1)}` },
        { label: 'Avaliações', value: String(professional.total_reviews) },
        { label: 'Experiência', value: `${professional.experience_years} anos` },
        { label: 'Preço base', value: professional.base_price ? formatCurrency(professional.base_price) : 'A combinar' },
    ];

    return (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de confiança">
            {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{metric.value}</p>
                </div>
            ))}
        </section>
    );
}
