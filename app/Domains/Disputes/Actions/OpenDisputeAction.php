<?php

namespace App\Domains\Disputes\Actions;

use App\Enums\ContractStatus;
use App\Enums\DisputeStatus;
use App\Enums\NotificationType;
use App\Models\Contract;
use App\Models\Dispute;
use App\Models\User;
use App\Support\NotificationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use LogicException;

class OpenDisputeAction
{
    public function __construct(private readonly NotificationService $notifications) {}

    /** @param array{reason: string, description?: string|null} $data */
    public function execute(User $user, Contract $contract, array $data): Dispute
    {
        return DB::transaction(function () use ($user, $contract, $data): Dispute {
            $lockedContract = Contract::query()
                ->with(['professionalProfile.user'])
                ->lockForUpdate()
                ->findOrFail($contract->id);

            if (! $this->isParticipant($user, $lockedContract)) {
                throw new AuthorizationException('Sem permissão para abrir uma disputa neste contrato.');
            }

            $hasActiveDispute = $lockedContract->disputes()
                ->whereIn('status', [DisputeStatus::Pending->value, DisputeStatus::UnderReview->value])
                ->exists();

            if ($hasActiveDispute) {
                throw new LogicException('Este contrato já possui uma disputa activa.');
            }

            if (! in_array($lockedContract->status, [ContractStatus::Active, ContractStatus::Completed], true)) {
                throw new LogicException('Só é possível abrir disputas para contratos activos ou concluídos.');
            }

            $dispute = $lockedContract->disputes()->create([
                ...$data,
                'opened_by' => $user->id,
                'status' => DisputeStatus::Pending,
            ]);

            $lockedContract->update(['status' => ContractStatus::Disputed]);

            $otherParticipant = $lockedContract->client_id === $user->id
                ? $lockedContract->professionalProfile?->user
                : $lockedContract->client;

            if ($otherParticipant) {
                $this->notifications->create(
                    $otherParticipant,
                    NotificationType::DisputeOpened->value,
                    'Nova disputa aberta',
                    'Foi aberta uma disputa relacionada com um dos seus contratos.',
                    ['dispute_id' => $dispute->id, 'contract_id' => $lockedContract->id],
                );
            }

            return $dispute;
        });
    }

    private function isParticipant(User $user, Contract $contract): bool
    {
        return $contract->client_id === $user->id
            || $contract->professionalProfile?->user_id === $user->id;
    }
}
