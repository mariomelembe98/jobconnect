<?php

namespace App\Domains\Reports\Actions;

use App\Models\Report;
use App\Models\User;

class CreateReportAction
{
    /** @param array<string, mixed> $data */
    public function execute(User $reporter, array $data): Report
    {
        return $reporter->reportsMade()->create($data);
    }
}
