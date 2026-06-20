<?php

namespace App\Policies;

use App\Models\Dispute;
use App\Models\User;

class DisputePolicy
{
    public function view(User $user, Dispute $dispute): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']) || $this->isParticipant($user, $dispute);
    }

    public function contribute(User $user, Dispute $dispute): bool
    {
        return $this->view($user, $dispute);
    }

    private function isParticipant(User $user, Dispute $dispute): bool
    {
        $contract = $dispute->contract;

        return $contract?->client_id === $user->id
            || $contract?->professionalProfile?->user_id === $user->id;
    }
}
