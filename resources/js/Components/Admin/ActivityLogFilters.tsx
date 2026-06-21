import { AdminFilterBar } from './AdminFilterBar';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_MODULE_LABELS } from '../../lib/constants';

export interface ActivityLogFiltersState {
    q: string;
    user_id: string;
    action: string;
    module: string;
    date_from: string;
    date_to: string;
}

interface ActivityLogFiltersProps {
    filters: ActivityLogFiltersState;
    onChange: (filters: ActivityLogFiltersState) => void;
    onApply: () => void;
    onReset: () => void;
    onRefresh: () => void;
    isLoading: boolean;
    total: number;
}

export function ActivityLogFilters({ filters, onChange, onApply, onReset, onRefresh, isLoading, total }: ActivityLogFiltersProps) {
    return (
        <AdminFilterBar
            title="Filtros de actividade"
            description="Pesquise por utilizador, acção, módulo e intervalo de datas."
            search={filters.q}
            onSearchChange={(value) => onChange({ ...filters, q: value })}
            onApply={onApply}
            onReset={onReset}
            action={
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{total} registos</div>
                    <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        Actualizar
                    </button>
                </div>
            }
        >
            <Input
                label="ID do utilizador"
                type="number"
                value={filters.user_id}
                placeholder="Ex.: 42"
                onChange={(event) => onChange({ ...filters, user_id: event.target.value })}
            />
            <Select
                label="Acção"
                value={filters.action}
                placeholder="Todas as acções"
                options={Object.entries(ACTIVITY_ACTION_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(event) => onChange({ ...filters, action: event.target.value })}
            />
            <Select
                label="Módulo"
                value={filters.module}
                placeholder="Todos os módulos"
                options={Object.entries(ACTIVITY_MODULE_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(event) => onChange({ ...filters, module: event.target.value })}
            />
            <Input
                label="Data inicial"
                type="date"
                value={filters.date_from}
                onChange={(event) => onChange({ ...filters, date_from: event.target.value })}
            />
            <Input
                label="Data final"
                type="date"
                value={filters.date_to}
                onChange={(event) => onChange({ ...filters, date_to: event.target.value })}
            />
        </AdminFilterBar>
    );
}
