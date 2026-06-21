import type { FormEvent } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

export interface ProposalFormValues {
    amount: string;
    delivery_days: string;
    message: string;
}

interface SubmitProposalFormProps {
    values: ProposalFormValues;
    errors: Record<string, string>;
    isSubmitting: boolean;
    onChange: (values: ProposalFormValues) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SubmitProposalForm({ values, errors, isSubmitting, onChange, onSubmit }: SubmitProposalFormProps) {
    return (
        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
            <div><h2 className="text-lg font-semibold text-slate-950">Enviar proposta</h2><p className="mt-1 text-sm leading-6 text-slate-500">Apresente o seu valor, prazo e uma mensagem para o cliente.</p></div>
            {errors.form ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errors.form}</div> : null}
            <Input label="Valor proposto (MZN)" type="number" min="1" step="0.01" value={values.amount} error={errors.amount} placeholder="0,00" onChange={(event) => onChange({ ...values, amount: event.target.value })} />
            <Input label="Prazo de entrega (dias)" type="number" min="1" value={values.delivery_days} error={errors.delivery_days} placeholder="Ex.: 5" onChange={(event) => onChange({ ...values, delivery_days: event.target.value })} />
            <Textarea label="Mensagem" rows={6} maxLength={2000} value={values.message} error={errors.message} hint={`${values.message.length}/2000 caracteres`} placeholder="Explique a sua abordagem e experiência relevante..." onChange={(event) => onChange({ ...values, message: event.target.value })} />
            <Button type="submit" isLoading={isSubmitting}>Enviar proposta</Button>
        </form>
    );
}
