<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminVerificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $documents = $this->relationLoaded('documents') ? $this->documents : collect();

        return [
            'id' => $this->id,
            'verification_status' => $this->verification_status?->value,
            'user' => new UserResource($this->whenLoaded('user')),
            'documents' => ProfessionalDocumentResource::collection($documents),
            'documents_count' => $documents->count(),
            'pending_documents_count' => $documents->where('status', 'pending')->count(),
            'approved_documents_count' => $documents->where('status', 'approved')->count(),
            'rejected_documents_count' => $documents->where('status', 'rejected')->count(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
