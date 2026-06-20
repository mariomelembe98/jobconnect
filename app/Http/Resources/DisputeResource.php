<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DisputeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'opened_by' => $this->opened_by,
            'assigned_to' => $this->assigned_to,
            'reason' => $this->reason,
            'description' => $this->description,
            'status' => $this->status?->value,
            'resolution' => $this->resolution?->value,
            'resolution_note' => $this->resolution_note,
            'resolved_at' => $this->resolved_at?->toISOString(),
            'contract' => $this->whenLoaded('contract', fn (): array => [
                'id' => $this->contract->id,
                'status' => $this->contract->status?->value,
                'client_id' => $this->contract->client_id,
                'professional_profile_id' => $this->contract->professional_profile_id,
            ]),
            'opener' => $this->whenLoaded('openedBy', fn (): array => [
                'id' => $this->openedBy->id,
                'name' => $this->openedBy->name,
            ]),
            'assignee' => $this->whenLoaded('assignedTo', fn (): ?array => $this->assignedTo ? [
                'id' => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
            ] : null),
            'evidence' => DisputeEvidenceResource::collection($this->whenLoaded('evidence')),
            'messages' => DisputeMessageResource::collection($this->whenLoaded('messages')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
