import { cn } from '../../lib/utils';

export type ContractStatusFilter = 'all' | 'active' | 'completed' | 'cancelled' | 'disputed';

interface ContractStatusTabsProps {
    activeTab: ContractStatusFilter;
    onChange: (status: ContractStatusFilter) => void;
}

const tabs: Array<{ label: string; value: ContractStatusFilter }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Ativos', value: 'active' },
    { label: 'Concluídos', value: 'completed' },
    { label: 'Cancelados', value: 'cancelled' },
    { label: 'Em disputa', value: 'disputed' },
];

export function ContractStatusTabs({ activeTab, onChange }: ContractStatusTabsProps) {
    return (
        <div className="overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Filtrar contratos por estado">
            <div className="flex min-w-max gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.value}
                        className={cn(
                            'border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100',
                            activeTab === tab.value
                                ? 'border-brand-600 text-brand-700'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
                        )}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
