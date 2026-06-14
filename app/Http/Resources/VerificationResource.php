<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'verification_status' => $this->resource['verification_status'],
            'documents_submitted' => $this->resource['documents_submitted'],
            'documents_required' => $this->resource['documents_required'],
            'required_documents' => $this->resource['required_documents'],
            'missing_required_documents' => $this->resource['missing_required_documents'],
            'documents' => ProfessionalDocumentResource::collection($this->resource['documents']),
        ];
    }
}
