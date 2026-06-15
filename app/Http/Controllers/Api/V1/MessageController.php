<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ConversationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Conversations\StoreMessageAttachmentRequest;
use App\Http\Resources\MessageAttachmentResource;
use App\Models\Message;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function storeAttachment(StoreMessageAttachmentRequest $request, Message $message): JsonResponse
    {
        $conversation = $message->conversation;

        if (! $conversation || ! $this->isParticipant($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para adicionar anexos a esta mensagem.');
        }

        if ($conversation->status?->value === ConversationStatus::Archived->value) {
            return $this->conflictResponse('Esta conversa está arquivada e não pode receber novos anexos.');
        }

        if ($message->sender_id !== $request->user()?->id) {
            return $this->forbiddenResponse('Apenas o autor da mensagem pode adicionar anexos.');
        }

        $file = $request->file('file');
        $filePath = $file?->store("conversation-messages/{$conversation->id}/messages/{$message->id}", 'public');

        $attachment = $message->attachments()->create([
            'file_path' => $filePath,
            'file_name' => $file?->getClientOriginalName(),
            'file_type' => $file?->getClientMimeType(),
            'file_size' => $file?->getSize(),
        ]);

        return ApiResponse::success(
            data: [
                'attachment' => new MessageAttachmentResource($attachment),
            ],
            message: 'Anexo carregado com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    private function isParticipant(Request $request, $conversation): bool
    {
        $user = $request->user();

        if ($user?->hasRole('client') === true && $conversation->client_id === $user->id) {
            return true;
        }

        if ($user?->hasRole('professional') === true && $user->professionalProfile?->id === $conversation->professional_profile_id) {
            return true;
        }

        return false;
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return ApiResponse::error(
            message: $message,
            status: JsonResponse::HTTP_FORBIDDEN,
        );
    }

    private function conflictResponse(string $message): JsonResponse
    {
        return ApiResponse::error(
            message: $message,
            status: JsonResponse::HTTP_CONFLICT,
        );
    }
}
