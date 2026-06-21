import { formatDate, initials } from '../../lib/formatters';
import type { Review } from '../../types';
import { EmptyState } from '../ui/EmptyState';

export function ReviewList({ reviews }: { reviews: Review[] }) {
    if (reviews.length === 0) {
        return <EmptyState title="Ainda não há avaliações" description="As avaliações de clientes aparecerão aqui após a conclusão de serviços." />;
    }

    return (
        <div className="grid gap-4">
            {reviews.map((review) => {
                const reviewerName = review.reviewer?.name ?? 'Cliente ProConnect';

                return (
                    <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-card shadow-card">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700">{initials(reviewerName)}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div><h3 className="font-semibold text-slate-950">{reviewerName}</h3><p className="mt-1 text-sm font-semibold text-amber-600">{'★'.repeat(review.rating)}<span className="text-slate-300">{'★'.repeat(5 - review.rating)}</span></p></div>
                                    <time className="text-xs text-slate-500">{formatDate(review.created_at)}</time>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment || 'O cliente não adicionou um comentário.'}</p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
