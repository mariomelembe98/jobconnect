<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestListResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'service_type' => $this->service_type,
            'budget_min' => $this->budget_min,
            'budget_max' => $this->budget_max,
            'budget_type' => $this->budget_type,
            'province' => $this->province,
            'city' => $this->city,
            'deadline_at' => $this->deadline_at?->toISOString(),
            'status' => $this->status?->value,
            'visibility' => $this->visibility,
            'attachments_count' => $this->attachments_count ?? 0,
            'client' => [
                'id' => $this->whenLoaded('client', fn () => $this->client->id),
                'name' => $this->whenLoaded('client', fn () => $this->client->name),
                'avatar' => $this->whenLoaded('client', fn () => $this->client->avatar),
            ],
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
