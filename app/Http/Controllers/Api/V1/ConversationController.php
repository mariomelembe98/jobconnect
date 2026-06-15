<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ConversationStatus;
use App\Enums\MessageType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Conversations\SendMessageRequest;
use App\Http\Resources\ConversationListResource;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Conversation::query()
            ->with(['serviceRequest.category', 'client', 'professionalProfile.user'])
            ->withCount('messages');

        if (! $this->isAdmin($request)) {
            $query = $this->scopeForParticipant($request, $query);
        }

        $conversations = $query->latest()->paginate(15)->withQueryString();

        return ApiResponse::success(
            data: [
                'conversations' => ConversationListResource::collection($conversations->getCollection()),
                'pagination' => [
                    'current_page' => $conversations->currentPage(),
                    'per_page' => $conversations->perPage(),
                    'last_page' => $conversations->lastPage(),
                    'total' => $conversations->total(),
                ],
            ],
            message: 'Conversas carregadas com sucesso.',
        );
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        if (! $this->canViewConversation($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para ver esta conversa.');
        }

        $conversation->load([
            'serviceRequest.category',
            'contract',
            'client',
            'professionalProfile.user',
        ])->loadCount('messages');

        return ApiResponse::success(
            data: [
                'conversation' => new ConversationResource($conversation),
            ],
            message: 'Conversa carregada com sucesso.',
        );
    }

    public function archive(Request $request, Conversation $conversation): JsonResponse
    {
        if (! $this->canModifyConversation($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para arquivar esta conversa.');
        }

        $conversation->update([
            'status' => ConversationStatus::Archived,
        ]);

        return ApiResponse::success(
            data: [
                'conversation' => new ConversationResource(
                    $conversation->refresh()->load(['serviceRequest.category', 'contract', 'client', 'professionalProfile.user'])->loadCount('messages'),
                ),
            ],
            message: 'Conversa arquivada com sucesso.',
        );
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        if (! $this->canViewConversation($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para ver estas mensagens.');
        }

        $messages = $conversation->messages()
            ->with(['sender', 'attachments'])
            ->oldest()
            ->get();

        return ApiResponse::success(
            data: [
                'messages' => MessageResource::collection($messages),
            ],
            message: 'Mensagens carregadas com sucesso.',
        );
    }

    public function storeMessage(SendMessageRequest $request, Conversation $conversation): JsonResponse
    {
        if (! $this->canModifyConversation($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para enviar mensagens nesta conversa.');
        }

        if ($conversation->status?->value === ConversationStatus::Archived->value) {
            return $this->conflictResponse('Esta conversa está arquivada e não pode receber novas mensagens.');
        }

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()?->id,
            'message' => $request->validated('message'),
            'message_type' => MessageType::Text,
        ]);

        return ApiResponse::success(
            data: [
                'message' => new MessageResource(
                    $message->fresh()->load(['sender', 'attachments']),
                ),
            ],
            message: 'Mensagem enviada com sucesso.',
            status: JsonResponse::HTTP_CREATED,
        );
    }

    public function read(Request $request, Conversation $conversation): JsonResponse
    {
        if (! $this->canModifyConversation($request, $conversation)) {
            return $this->forbiddenResponse('Sem permissão para marcar mensagens como lidas.');
        }

        $markedAsRead = $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $request->user()?->id)
            ->update([
                'read_at' => now(),
            ]);

        return ApiResponse::success(
            data: [
                'messages_marked_as_read' => $markedAsRead,
            ],
            message: 'Mensagens marcadas como lidas com sucesso.',
        );
    }

    private function scopeForParticipant(Request $request, Builder $query): Builder
    {
        $user = $request->user();

        if ($user?->hasRole('client') === true) {
            $query->where('client_id', $user->id);

            return $query;
        }

        if ($user?->hasRole('professional') === true) {
            $professionalProfile = $user?->professionalProfile;

            if (! $professionalProfile) {
                return $query->whereRaw('1 = 0');
            }

            $query->where('professional_profile_id', $professionalProfile->id);

            return $query;
        }

        return $query->whereRaw('1 = 0');
    }

    private function canViewConversation(Request $request, Conversation $conversation): bool
    {
        return $this->isAdmin($request) || $this->isParticipant($request, $conversation);
    }

    private function canModifyConversation(Request $request, Conversation $conversation): bool
    {
        return $this->isParticipant($request, $conversation);
    }

    private function isParticipant(Request $request, Conversation $conversation): bool
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

    private function isAdmin(Request $request): bool
    {
        return $request->user()?->hasAnyRole(['admin', 'super_admin']) === true;
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
