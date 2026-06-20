<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reporter_id' => $this->reporter_id,
            'reported_user_id' => $this->reported_user_id,
            'service_request_id' => $this->service_request_id,
            'contract_id' => $this->contract_id,
            'report_type' => $this->report_type?->value,
            'reason' => $this->reason?->value,
            'description' => $this->description,
            'status' => $this->status?->value,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'resolution_note' => $this->resolution_note,
            'reporter' => $this->whenLoaded('reporter', fn (): array => [
                'id' => $this->reporter->id,
                'name' => $this->reporter->name,
            ]),
            'reported_user' => $this->whenLoaded('reportedUser', fn (): ?array => $this->reportedUser ? [
                'id' => $this->reportedUser->id,
                'name' => $this->reportedUser->name,
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
