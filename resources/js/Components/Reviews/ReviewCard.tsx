import { Link } from '@inertiajs/react';

import { Badge } from '../ui/Badge';
import { formatDate, initials } from '../../lib/formatters';
import type { Review } from '../../types';

interface ReviewCardProps {
    review: Review;
    currentUserId?: number;
}

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
    const wasGiven = review.reviewer_id === currentUserId;
    const person = wasGiven ? review.reviewed : review.reviewer;
    const personName = person?.name ?? (wasGiven ? 'Utilizador avaliado' : 'Utilizador ProConnect');

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                    {person?.avatar ? <img src={person.avatar} alt="" className="size-full object-cover" /> : initials(personName)}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div><h2 className="font-bold text-slate-950">{personName}</h2><div className="mt-1 flex items-center gap-2"><span className="font-semibold text-amber-500" aria-label={`${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></span><Badge variant={wasGiven ? 'blue' : 'green'}>{wasGiven ? 'Feita por si' : 'Recebida'}</Badge></div></div>
                        <time className="text-xs text-slate-400" dateTime={review.created_at}>{formatDate(review.created_at)}</time>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{review.comment || 'Esta avaliação não inclui comentário.'}</p>
                    <div className="mt-4 border-t border-slate-100 pt-3"><Link href={`/contracts/${review.contract_id}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Ver contrato #{review.contract_id}</Link></div>
                </div>
            </div>
        </article>
    );
}
