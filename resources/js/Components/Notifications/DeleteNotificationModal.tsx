import { ConfirmActionModal } from '../ServiceRequests/ConfirmActionModal';
import type { Notification } from '../../types';

interface DeleteNotificationModalProps {
    notification: Notification | null;
    isLoading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteNotificationModal({ notification, isLoading, onConfirm, onClose }: DeleteNotificationModalProps) {
    return <ConfirmActionModal open={notification !== null} title="Eliminar notificação?" description={`A notificação “${notification?.title ?? ''}” será removida permanentemente.`} confirmLabel="Eliminar notificação" destructive isLoading={isLoading} onConfirm={onConfirm} onClose={onClose} />;
}
