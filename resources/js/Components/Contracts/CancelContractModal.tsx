import { ConfirmActionModal } from '../ServiceRequests/ConfirmActionModal';

interface CancelContractModalProps {
    open: boolean;
    reason: string;
    isLoading: boolean;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export function CancelContractModal({ open, reason, isLoading, onReasonChange, onConfirm, onClose }: CancelContractModalProps) {
    return (
        <ConfirmActionModal
            open={open}
            title="Cancelar contrato?"
            description="O cancelamento encerra este contrato e o respetivo pedido. Indique o motivo antes de continuar."
            confirmLabel="Cancelar contrato"
            destructive
            reason={reason}
            reasonLabel="Motivo do cancelamento"
            isLoading={isLoading}
            onReasonChange={onReasonChange}
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
}
