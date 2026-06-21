import { cn } from '../../lib/utils';

export type ProposalStatusFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

interface ProposalStatusTabsProps {
    activeTab: ProposalStatusFilter;
    onChange: (status: ProposalStatusFilter) => void;
}

const tabs: Array<{ label: string; value: ProposalStatusFilter }> = [
    { label: 'Todas', value: 'all' },
    { label: 'Pendentes', value: 'pending' },
    { label: 'Aceites', value: 'accepted' },
    { label: 'Rejeitadas', value: 'rejected' },
    { label: 'Retiradas', value: 'withdrawn' },
];

export function ProposalStatusTabs({ activeTab, onChange }: ProposalStatusTabsProps) {
    return (
        <div className="overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Filtrar propostas por estado">
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
