import { Badge } from '../ui/Badge';
import { STATUS_LABELS } from '../../lib/constants';

type AdminStatusKind = 'user' | 'verification' | 'report' | 'dispute';

const variantsByKind: Record<AdminStatusKind, Record<string, 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'>> = {
    user: {
        active: 'green',
        pending: 'amber',
        suspended: 'amber',
        blocked: 'red',
        inactive: 'gray',
    },
    verification: {
        pending: 'amber',
        under_review: 'blue',
        approved: 'green',
        rejected: 'red',
        expired: 'gray',
    },
    report: {
        pending: 'amber',
        reviewing: 'blue',
        resolved: 'green',
        dismissed: 'gray',
    },
    dispute: {
        pending: 'amber',
        under_review: 'blue',
        resolved: 'green',
        dismissed: 'gray',
    },
};

interface AdminStatusBadgeProps {
    kind: AdminStatusKind;
    value: string | null | undefined;
}

export function AdminStatusBadge({ kind, value }: AdminStatusBadgeProps) {
    if (!value) {
        return <Badge variant="gray">—</Badge>;
    }

    const variant = variantsByKind[kind][value] ?? 'gray';
    const label = STATUS_LABELS[value] ?? value;

    return <Badge variant={variant}>{label}</Badge>;
}
