import { cn } from '../../lib/utils';

export type NotificationFilter = 'all' | 'unread' | 'messages' | 'proposals' | 'contracts' | 'verification';

interface NotificationFilterTabsProps {
    activeTab: NotificationFilter;
    onChange: (filter: NotificationFilter) => void;
}

const tabs: Array<{ label: string; value: NotificationFilter }> = [
    { label: 'Todas', value: 'all' },
    { label: 'Não lidas', value: 'unread' },
    { label: 'Mensagens', value: 'messages' },
    { label: 'Propostas', value: 'proposals' },
    { label: 'Contratos', value: 'contracts' },
    { label: 'Verificação', value: 'verification' },
];

export function NotificationFilterTabs({ activeTab, onChange }: NotificationFilterTabsProps) {
    return (
        <div className="overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Filtrar notificações">
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
