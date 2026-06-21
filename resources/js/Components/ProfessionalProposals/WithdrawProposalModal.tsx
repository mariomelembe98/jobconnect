import { ConfirmActionModal } from '../ServiceRequests/ConfirmActionModal';
import type { Proposal } from '../../types';

interface WithdrawProposalModalProps {
    proposal: Proposal | null;
    isLoading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function WithdrawProposalModal({ proposal, isLoading, onConfirm, onClose }: WithdrawProposalModalProps) {
    return (
        <ConfirmActionModal
            open={proposal !== null}
            title="Retirar proposta?"
            description={`A proposta para “${proposal?.service_request?.title ?? 'este pedido'}” deixará de poder ser aceite. Esta acção não pode ser anulada.`}
            confirmLabel="Retirar proposta"
            destructive
            isLoading={isLoading}
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
}
