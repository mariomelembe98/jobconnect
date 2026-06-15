<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProposalResource extends JsonResource
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
            'professional_profile_id' => $this->professional_profile_id,
            'amount' => $this->amount,
            'delivery_days' => $this->delivery_days,
            'message' => $this->message,
            'status' => $this->status?->value,
            'accepted_at' => $this->accepted_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'withdrawn_at' => $this->withdrawn_at?->toISOString(),
            'service_request' => $this->whenLoaded('serviceRequest', function (): array {
                return [
                    'id' => $this->serviceRequest->id,
                    'title' => $this->serviceRequest->title,
                    'status' => $this->serviceRequest->status?->value,
                    'province' => $this->serviceRequest->province,
                    'city' => $this->serviceRequest->city,
                    'category' => new CategoryResource($this->serviceRequest->category),
                ];
            }),
            'professional_profile' => $this->whenLoaded('professionalProfile', function (): array {
                return [
                    'id' => $this->professionalProfile->id,
                    'headline' => $this->professionalProfile->headline,
                    'availability' => $this->professionalProfile->availability?->value,
                    'average_rating' => $this->professionalProfile->average_rating,
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
