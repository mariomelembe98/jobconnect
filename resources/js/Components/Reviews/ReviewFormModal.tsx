import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';

interface ReviewFormModalProps {
    open: boolean;
    subjectName: string;
    isLoading: boolean;
    error?: string;
    onSubmit: (rating: number, comment: string) => void;
    onClose: () => void;
}

export function ReviewFormModal({ open, subjectName, isLoading, error, onSubmit, onClose }: ReviewFormModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingError, setRatingError] = useState<string | undefined>();

    useEffect(() => {
        if (open) {
            setRating(0);
            setComment('');
            setRatingError(undefined);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        function closeOnEscape(event: KeyboardEvent): void {
            if (event.key === 'Escape' && !isLoading) onClose();
        }

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isLoading, onClose, open]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (rating < 1) {
            setRatingError('Selecione uma classificação entre 1 e 5 estrelas.');
            return;
        }

        setRatingError(undefined);
        onSubmit(rating, comment.trim());
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) onClose(); }}>
            <form className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated" role="dialog" aria-modal="true" aria-labelledby="review-modal-title" onSubmit={submit}>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Avaliação do serviço</p>
                <h2 id="review-modal-title" className="mt-1 text-xl font-bold text-slate-950">Como foi trabalhar com {subjectName}?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">A sua avaliação ajuda a manter uma comunidade profissional e de confiança.</p>

                <fieldset className="mt-6">
                    <legend className="text-sm font-semibold text-slate-700">Classificação</legend>
                    <div className="mt-2 flex gap-1" aria-label="Classificação de uma a cinco estrelas">
                        {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={cn('rounded-lg p-1 text-3xl leading-none transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100', value <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300')}
                                aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                                aria-pressed={rating === value}
                                onClick={() => { setRating(value); setRatingError(undefined); }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {ratingError ? <p className="mt-2 text-sm text-red-600">{ratingError}</p> : null}
                </fieldset>

                <Textarea className="mt-1" label="Comentário (opcional)" value={comment} maxLength={1000} rows={5} placeholder="Conte como decorreu o serviço..." hint={`${comment.length}/1000 caracteres`} disabled={isLoading} onChange={(event) => setComment(event.target.value)} />
                {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" disabled={isLoading} onClick={onClose}>Voltar</Button>
                    <Button type="submit" isLoading={isLoading}>Enviar avaliação</Button>
                </div>
            </form>
        </div>
    );
}
