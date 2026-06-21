import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface BudgetFieldsProps {
    budgetMin: string;
    budgetMax: string;
    budgetType: string;
    errors: Record<string, string>;
    onChange: (field: 'budget_min' | 'budget_max' | 'budget_type', value: string) => void;
}

export function BudgetFields({ budgetMin, budgetMax, budgetType, errors, onChange }: BudgetFieldsProps) {
    return (
        <section className="grid gap-4" aria-labelledby="budget-title">
            <div><h2 id="budget-title" className="text-lg font-semibold text-slate-950">Orçamento</h2><p className="mt-1 text-sm text-slate-500">Indique uma faixa estimada ou deixe os valores em branco para negociar.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Orçamento mínimo (MZN)" type="number" min="0" step="0.01" value={budgetMin} error={errors.budget_min} placeholder="0,00" onChange={(event) => onChange('budget_min', event.target.value)} />
                <Input label="Orçamento máximo (MZN)" type="number" min="0" step="0.01" value={budgetMax} error={errors.budget_max} placeholder="0,00" onChange={(event) => onChange('budget_max', event.target.value)} />
            </div>
            <Select
                label="Tipo de orçamento"
                value={budgetType}
                error={errors.budget_type}
                options={[
                    { label: 'Valor fixo', value: 'fixed' },
                    { label: 'Por hora', value: 'hourly' },
                    { label: 'Negociável', value: 'negotiable' },
                ]}
                onChange={(event) => onChange('budget_type', event.target.value)}
            />
        </section>
    );
}
