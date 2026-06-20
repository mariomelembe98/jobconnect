<?php

namespace App\Enums;

enum NotificationType: string
{
    case ProposalReceived = 'proposal_received';
    case ProposalAccepted = 'proposal_accepted';
    case ProposalRejected = 'proposal_rejected';
    case ContractCreated = 'contract_created';
    case ContractCompleted = 'contract_completed';
    case ContractCancelled = 'contract_cancelled';
    case NewMessage = 'new_message';
    case VerificationApproved = 'verification_approved';
    case VerificationRejected = 'verification_rejected';
    case ReviewReceived = 'review_received';
    case DisputeOpened = 'dispute_opened';
    case DisputeResolved = 'dispute_resolved';
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::ProposalReceived => 'Proposta recebida',
            self::ProposalAccepted => 'Proposta aceite',
            self::ProposalRejected => 'Proposta rejeitada',
            self::ContractCreated => 'Contrato criado',
            self::ContractCompleted => 'Contrato concluído',
            self::ContractCancelled => 'Contrato cancelado',
            self::NewMessage => 'Nova mensagem',
            self::VerificationApproved => 'Verificação aprovada',
            self::VerificationRejected => 'Verificação rejeitada',
            self::ReviewReceived => 'Avaliação recebida',
            self::DisputeOpened => 'Disputa aberta',
            self::DisputeResolved => 'Disputa resolvida',
            self::System => 'Sistema',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
