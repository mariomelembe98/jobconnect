<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
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
            'contract_id' => $this->contract_id,
            'client_id' => $this->client_id,
            'professional_profile_id' => $this->professional_profile_id,
            'status' => $this->status?->value,
            'service_request' => $this->whenLoaded('serviceRequest', function (): array {
                return [
                    'id' => $this->serviceRequest->id,
                    'title' => $this->serviceRequest->title,
                    'status' => $this->serviceRequest->status?->value,
                    'category' => new CategoryResource($this->serviceRequest->category),
                ];
            }),
            'contract' => $this->whenLoaded('contract', function (): array {
                return [
                    'id' => $this->contract->id,
                    'status' => $this->contract->status?->value,
                    'amount' => $this->contract->amount,
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
            'messages_count' => $this->messages_count ?? 0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
