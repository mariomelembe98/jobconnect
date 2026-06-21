import { Badge } from '../ui/Badge';

interface NotificationBadgeProps {
    count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
    return (
        <Badge variant={count > 0 ? 'blue' : 'gray'} aria-label={`${count} notificações por ler`}>
            {count > 99 ? '99+' : count} por ler
        </Badge>
    );
}
