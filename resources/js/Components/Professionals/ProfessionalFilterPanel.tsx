import { MOZAMBIQUE_PROVINCES } from '../../lib/constants';
import type { Category, Skill } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export interface ProfessionalDirectoryFilters {
    q: string;
    category_id: string;
    skill_id: string;
    province: string;
    city: string;
    verified: boolean;
    availability: boolean;
    rating: boolean;
    sort: '-average_rating' | 'experience_years' | '-created_at';
}

interface ProfessionalFilterPanelProps {
    filters: ProfessionalDirectoryFilters;
    categories: Category[];
    skills: Skill[];
    isApplying: boolean;
    onChange: (filters: ProfessionalDirectoryFilters) => void;
    onApply: () => void;
    onReset: () => void;
}

export function ProfessionalFilterPanel({ filters, categories, skills, isApplying, onChange, onApply, onReset }: ProfessionalFilterPanelProps) {
    const visibleSkills = filters.category_id
        ? skills.filter((skill) => String(skill.category_id) === filters.category_id)
        : skills;

    function update<K extends keyof ProfessionalDirectoryFilters>(key: K, value: ProfessionalDirectoryFilters[K]): void {
        onChange({ ...filters, [key]: value });
    }

    return (
        <aside className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-card shadow-card" aria-label="Filtros de profissionais">
            <div>
                <h2 className="font-semibold text-slate-950">Filtros</h2>
                <p className="mt-1 text-sm text-slate-500">Encontre o profissional certo para o serviço.</p>
            </div>

            <Select
                label="Categoria"
                value={filters.category_id}
                placeholder="Todas as categorias"
                options={categories.map((category) => ({ label: category.name, value: String(category.id) }))}
                onChange={(event) => onChange({ ...filters, category_id: event.target.value, skill_id: '' })}
            />
            <Select
                label="Competência"
                value={filters.skill_id}
                placeholder="Todas as competências"
                options={visibleSkills.map((skill) => ({ label: skill.name, value: String(skill.id) }))}
                onChange={(event) => update('skill_id', event.target.value)}
            />
            <Select
                label="Província"
                value={filters.province}
                placeholder="Todas as províncias"
                options={MOZAMBIQUE_PROVINCES.map((province) => ({ label: province, value: province }))}
                onChange={(event) => update('province', event.target.value)}
            />
            <Input label="Cidade" value={filters.city} placeholder="Ex.: Maputo" onChange={(event) => update('city', event.target.value)} />

            <fieldset className="grid gap-3">
                <legend className="text-sm font-medium text-slate-700">Preferências</legend>
                <FilterCheckbox checked={filters.verified} label="Apenas verificados" onChange={(checked) => update('verified', checked)} />
                <FilterCheckbox checked={filters.availability} label="Disponível agora" onChange={(checked) => update('availability', checked)} />
                <FilterCheckbox checked={filters.rating} label="Avaliação mínima de 4" onChange={(checked) => update('rating', checked)} />
            </fieldset>

            <Select
                label="Ordenar por"
                value={filters.sort}
                options={[
                    { label: 'Melhor avaliação', value: '-average_rating' },
                    { label: 'Menor experiência primeiro', value: 'experience_years' },
                    { label: 'Mais recentes', value: '-created_at' },
                ]}
                onChange={(event) => update('sort', event.target.value as ProfessionalDirectoryFilters['sort'])}
            />

            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={onReset}>Limpar</Button>
                <Button onClick={onApply} isLoading={isApplying}>Aplicar</Button>
            </div>
        </aside>
    );
}

function FilterCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:border-brand-200 hover:bg-brand-50/50">
            <input type="checkbox" checked={checked} className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" onChange={(event) => onChange(event.target.checked)} />
            <span>{label}</span>
        </label>
    );
}
