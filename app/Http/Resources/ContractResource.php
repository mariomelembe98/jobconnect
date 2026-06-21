<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
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
            'service_request_id' => $this->service_request_id,
            'proposal_id' => $this->proposal_id,
            'client_id' => $this->client_id,
            'professional_profile_id' => $this->professional_profile_id,
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
                    'category' => new CategoryResource($this->serviceRequest->category),
                ];
            }),
            'proposal' => $this->whenLoaded('proposal', function (): array {
                return [
                    'id' => $this->proposal->id,
                    'amount' => $this->proposal->amount,
                    'status' => $this->proposal->status?->value,
                ];
            }),
            'client' => $this->whenLoaded('client', function (): array {
                return [
                    'id' => $this->client->id,
                    'name' => $this->client->name,
                    'avatar' => $this->client->avatar,
                ];
            }),
            'professional_profile' => $this->whenLoaded('professionalProfile', function (): array {
                return [
                    'id' => $this->professionalProfile->id,
                    'headline' => $this->professionalProfile->headline,
                    'availability' => $this->professionalProfile->availability?->value,
                    'user' => [
                        'id' => $this->professionalProfile->user?->id,
                        'name' => $this->professionalProfile->user?->name,
                        'avatar' => $this->professionalProfile->user?->avatar,
                    ],
                ];
            }),
            'status_logs_count' => $this->status_logs_count ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
