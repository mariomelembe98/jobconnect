<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'platform_fee' => $this->platform_fee,
            'professional_amount' => $this->professional_amount,
            'status' => $this->status?->value,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'conversation' => $this->whenLoaded('conversation', fn (): ?array => $this->conversation ? [
                'id' => $this->conversation->id,
            ] : null),
            'service_request' => $this->whenLoaded('serviceRequest', function (): array {
                return [
                    'id' => $this->serviceRequest->id,
                    'title' => $this->serviceRequest->title,
                    'status' => $this->serviceRequest->status?->value,
                ];
            }),
            'proposal' => $this->whenLoaded('proposal', function (): array {
                return [
                    'id' => $this->proposal->id,
                    'status' => $this->proposal->status?->value,
                    'amount' => $this->proposal->amount,
                ];
            }),
            'professional_profile' => $this->whenLoaded('professionalProfile', function (): array {
                return [
                    'id' => $this->professionalProfile->id,
                    'headline' => $this->professionalProfile->headline,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
