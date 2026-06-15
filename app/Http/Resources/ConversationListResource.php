<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationListResource extends JsonResource
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
            'status' => $this->status?->value,
            'service_request_id' => $this->service_request_id,
            'contract_id' => $this->contract_id,
            'client_id' => $this->client_id,
            'professional_profile_id' => $this->professional_profile_id,
            'messages_count' => $this->messages_count ?? 0,
            'service_request' => $this->whenLoaded('serviceRequest', function (): array {
                return [
                    'id' => $this->serviceRequest->id,
                    'title' => $this->serviceRequest->title,
                    'status' => $this->serviceRequest->status?->value,
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
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
