<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function view(User $user, Report $report): bool
    {
        return $user->hasAnyRole(['admin', 'super_admin']) || $report->reporter_id === $user->id;
    }
}
