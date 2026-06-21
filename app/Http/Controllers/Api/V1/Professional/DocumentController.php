<?php

namespace App\Http\Controllers\Api\V1\Professional;

use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Professional\StoreProfessionalDocumentRequest;
use App\Http\Resources\ProfessionalDocumentResource;
use App\Http\Resources\VerificationResource;
use App\Models\ProfessionalDocument;
use App\Models\ProfessionalProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    private const REQUIRED_DOCUMENTS = ['bi', 'nuit'];

    private const STORAGE_DISK = 'local';

    public function verification(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        $documents = $profile->documents()->latest()->get();
        $submittedTypes = $documents->pluck('document_type')->unique()->values()->all();
        $missingRequiredDocuments = array_values(array_diff(self::REQUIRED_DOCUMENTS, $submittedTypes));

        return ApiResponse::success(
            data: [
                'verification' => new VerificationResource([
                    'verification_status' => $profile->verification_status?->value,
                    'documents_submitted' => $documents->count(),
                    'documents_required' => count(self::REQUIRED_DOCUMENTS),
                    'required_documents' => self::REQUIRED_DOCUMENTS,
                    'missing_required_documents' => $missingRequiredDocuments,
                    'documents' => $documents,
                ]),
            ],
            message: 'Estado de verificação carregado com sucesso.',
        );
    }

    public function index(Request $request): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        return ApiResponse::success(
            data: [
                'documents' => ProfessionalDocumentResource::collection(
                    $profile->documents()->latest()->get(),
                ),
            ],
            message: 'Documentos carregados com sucesso.',
        );
    }

    public function store(StoreProfessionalDocumentRequest $request): JsonResponse
    {
        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        $file = $request->file('file');
        $filePath = $file->store("verification-documents/{$profile->id}", self::STORAGE_DISK);

        $document = $profile->documents()->create([
            'document_type' => $request->validated('document_type'),
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'status' => VerificationStatus::Pending->value,
        ]);

        if ($profile->verification_status === VerificationStatus::Rejected) {
            $profile->update([
                'verification_status' => VerificationStatus::Pending,
            ]);
        }

        return ApiResponse::success(
            data: [
                'document' => new ProfessionalDocumentResource($document),
            ],
            message: 'Documento carregado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function show(Request $request, ProfessionalDocument $document): JsonResponse
    {
        if (! $this->isProfessional($request)) {
            return $this->professionalOnlyResponse();
        }

        $profile = $this->profileFor($request);

        if (! $profile) {
            return $this->missingProfileResponse();
        }

        if ($document->professional_profile_id !== $profile->id) {
            return ApiResponse::error(
                message: 'Não pode visualizar este documento.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        return ApiResponse::success(
            data: [
                'document' => new ProfessionalDocumentResource($document),
            ],
            message: 'Documento carregado com sucesso.',
        );
    }

    public function download(Request $request, ProfessionalDocument $document): StreamedResponse|JsonResponse
    {
        if (! $this->canAccessDocument($request, $document)) {
            return ApiResponse::error(
                message: 'Não pode descarregar este documento.',
                status: JsonResponse::HTTP_FORBIDDEN,
            );
        }

        if (! $document->file_path || ! Storage::disk(self::STORAGE_DISK)->exists($document->file_path)) {
            return ApiResponse::error(
                message: 'Ficheiro não encontrado.',
                status: JsonResponse::HTTP_NOT_FOUND,
            );
        }

        return Storage::disk(self::STORAGE_DISK)->download($document->file_path, $document->file_name);
    }

    private function canAccessDocument(Request $request, ProfessionalDocument $document): bool
    {
        $user = $request->user();

        if ($user?->hasAnyRole(['admin', 'super_admin']) === true) {
            return true;
        }

        return $this->isProfessional($request)
            && $this->profileFor($request)?->id === $document->professional_profile_id;
    }

    private function isProfessional(Request $request): bool
    {
        return $request->user()?->hasRole('professional') === true;
    }

    private function profileFor(Request $request): ?ProfessionalProfile
    {
        return $request->user()?->professionalProfile;
    }

    private function professionalOnlyResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Acesso reservado a profissionais.',
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function missingProfileResponse(): JsonResponse
    {
        return ApiResponse::error(
            message: 'Crie um perfil profissional antes de gerir documentos.',
            status: JsonResponse::HTTP_CONFLICT,
        );
    }
}
