import { MOZAMBIQUE_PROVINCES } from '../../lib/constants';
import type { Category } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface ProfessionalJobFilters {
    q: string;
    category_id: string;
    province: string;
    city: string;
    service_type: string;
    budget_min: string;
    budget_max: string;
    status: string;
    sort: '-created_at' | 'deadline_at' | 'budget_max';
}

interface ProfessionalJobFilterPanelProps {
    filters: ProfessionalJobFilters;
    categories: Category[];
    isApplying: boolean;
    onChange: (filters: ProfessionalJobFilters) => void;
    onApply: () => void;
    onReset: () => void;
}

export function ProfessionalJobFilterPanel({ filters, categories, isApplying, onChange, onApply, onReset }: ProfessionalJobFilterPanelProps) {
    function update<K extends keyof ProfessionalJobFilters>(field: K, value: ProfessionalJobFilters[K]): void {
        onChange({ ...filters, [field]: value });
    }

    return (
        <aside className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-card shadow-card" aria-label="Filtros de trabalhos">
            <div><h2 className="font-semibold text-slate-950">Filtrar trabalhos</h2><p className="mt-1 text-sm text-slate-500">Refine as oportunidades disponíveis.</p></div>
            <Input label="Pesquisar" value={filters.q} placeholder="Título, descrição ou categoria" onChange={(event) => update('q', event.target.value)} />
            <Select label="Categoria" value={filters.category_id} placeholder="Todas as categorias" options={categories.map((category) => ({ label: category.name, value: String(category.id) }))} onChange={(event) => update('category_id', event.target.value)} />
            <Select label="Província" value={filters.province} placeholder="Todas as províncias" options={MOZAMBIQUE_PROVINCES.map((province) => ({ label: province, value: province }))} onChange={(event) => update('province', event.target.value)} />
            <Input label="Cidade" value={filters.city} placeholder="Ex.: Matola" onChange={(event) => update('city', event.target.value)} />
            <Select label="Tipo de serviço" value={filters.service_type} placeholder="Todos os tipos" options={[{ label: 'No local', value: 'local' }, { label: 'Remoto', value: 'remote' }, { label: 'Híbrido', value: 'hybrid' }]} onChange={(event) => update('service_type', event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Orçamento mín." type="number" min="0" value={filters.budget_min} onChange={(event) => update('budget_min', event.target.value)} />
                <Input label="Orçamento máx." type="number" min="0" value={filters.budget_max} onChange={(event) => update('budget_max', event.target.value)} />
            </div>
            <Select label="Estado" value={filters.status} placeholder="Todos os estados" options={[{ label: 'Publicado', value: 'published' }, { label: 'A receber propostas', value: 'receiving_proposals' }]} onChange={(event) => update('status', event.target.value)} />
            <Select label="Ordenar por" value={filters.sort} options={[{ label: 'Mais recentes', value: '-created_at' }, { label: 'Prazo mais próximo', value: 'deadline_at' }, { label: 'Menor orçamento máximo', value: 'budget_max' }]} onChange={(event) => update('sort', event.target.value as ProfessionalJobFilters['sort'])} />
            <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={onReset}>Limpar</Button><Button onClick={onApply} isLoading={isApplying}>Aplicar</Button></div>
        </aside>
    );
}
