import { ConfirmActionModal } from '../ServiceRequests/ConfirmActionModal';

interface CompleteContractModalProps {
    open: boolean;
    isLoading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function CompleteContractModal({ open, isLoading, onConfirm, onClose }: CompleteContractModalProps) {
    return (
        <ConfirmActionModal
            open={open}
            title="Concluir contrato?"
            description="Confirme apenas quando o serviço tiver sido entregue. O pedido será marcado como concluído."
            confirmLabel="Concluir contrato"
            isLoading={isLoading}
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
}
