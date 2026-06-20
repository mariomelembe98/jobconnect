<?php

namespace App\Domains\Admin\Actions;

use App\Enums\ContractStatus;
use App\Enums\DisputeStatus;
use App\Enums\NotificationType;
use App\Models\Dispute;
use App\Support\NotificationService;
use Illuminate\Support\Facades\DB;

class ResolveDisputeAction
{
    public function __construct(private readonly NotificationService $notifications) {}

    /** @param array{resolution: string, resolution_note?: string|null} $data */
    public function execute(Dispute $dispute, array $data): Dispute
    {
        $resolved = DB::transaction(function () use ($dispute, $data): Dispute {
            $dispute->update([
                ...$data,
                'status' => DisputeStatus::Resolved,
                'resolved_at' => now(),
            ]);

            if ($dispute->contract?->status === ContractStatus::Disputed) {
                $dispute->contract->update([
                    'status' => ContractStatus::Completed,
                    'completed_at' => $dispute->contract->completed_at ?? now(),
                ]);
            }

            return $dispute;
        });

        $this->notifyParticipants($resolved);

        return $resolved;
    }

    private function notifyParticipants(Dispute $dispute): void
    {
        $contract = $dispute->contract?->loadMissing(['client', 'professionalProfile.user']);

        foreach (array_filter([$contract?->client, $contract?->professionalProfile?->user]) as $participant) {
            $this->notifications->create(
                $participant,
                NotificationType::DisputeResolved->value,
                'Disputa resolvida',
                'Uma disputa relacionada com o seu contrato foi resolvida.',
                ['dispute_id' => $dispute->id, 'contract_id' => $contract?->id],
            );
        }
    }
}
