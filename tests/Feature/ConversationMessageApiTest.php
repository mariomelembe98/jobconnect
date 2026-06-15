<?php

use App\Enums\ConversationStatus;
use App\Enums\MessageType;
use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Conversation;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('accepting proposal creates conversation automatically', function () {
    $client = conversationClientUser();
    $serviceRequest = conversationCreateServiceRequest($client);
    $professional = conversationProfessionalUser();
    $proposal = conversationCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/accept");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta aceite com sucesso.')
        ->assertJsonPath('data.conversation.status', 'active')
        ->assertJsonPath('data.conversation.service_request_id', $serviceRequest->id);

    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->assertDatabaseHas('conversations', [
        'contract_id' => $contract->id,
        'service_request_id' => $serviceRequest->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'status' => 'active',
    ]);
});

test('client can list own conversations', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/conversations');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Conversas carregadas com sucesso.')
        ->assertJsonCount(1, 'data.conversations')
        ->assertJsonPath('data.conversations.0.id', $conversation->id);
});

test('professional can list own conversations', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($professional);

    $response = $this->getJson('/api/v1/conversations');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Conversas carregadas com sucesso.')
        ->assertJsonCount(1, 'data.conversations')
        ->assertJsonPath('data.conversations.0.id', $conversation->id);
});

test('unrelated user cannot view conversation', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    $unrelatedUser = conversationClientUser();
    Sanctum::actingAs($unrelatedUser);

    $this->getJson("/api/v1/conversations/{$conversation->id}")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para ver esta conversa.');
});

test('participant can view conversation details', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $response = $this->getJson("/api/v1/conversations/{$conversation->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Conversa carregada com sucesso.')
        ->assertJsonPath('data.conversation.id', $conversation->id)
        ->assertJsonPath('data.conversation.status', 'active');
});

test('participant can list messages', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    $message = $conversation->messages()->create([
        'sender_id' => $professional->id,
        'message' => 'Olá, esta é uma mensagem.',
        'message_type' => MessageType::Text,
    ]);
    Sanctum::actingAs($client);

    $response = $this->getJson("/api/v1/conversations/{$conversation->id}/messages");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Mensagens carregadas com sucesso.')
        ->assertJsonCount(1, 'data.messages')
        ->assertJsonPath('data.messages.0.id', $message->id);
});

test('participant can send text message', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Mensagem enviada pelo cliente.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Mensagem enviada com sucesso.')
        ->assertJsonPath('data.message.message', 'Mensagem enviada pelo cliente.')
        ->assertJsonPath('data.message.message_type', 'text');

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $client->id,
        'message' => 'Mensagem enviada pelo cliente.',
        'message_type' => 'text',
    ]);
});

test('non-participant cannot send message', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs(conversationClientUser());

    $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Mensagem intrusa.',
    ])
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para enviar mensagens nesta conversa.');
});

test('archived conversation cannot receive message', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/conversations/{$conversation->id}/archive")->assertSuccessful();

    $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Mensagem bloqueada.',
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Esta conversa está arquivada e não pode receber novas mensagens.');
});

test('participant can upload message attachment', function () {
    Storage::fake('public');

    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $messageResponse = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Mensagem com anexo.',
    ]);

    $messageId = $messageResponse->json('data.message.id');
    $attachmentFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->postJson("/api/v1/messages/{$messageId}/attachments", [
        'file' => $attachmentFile,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Anexo carregado com sucesso.')
        ->assertJsonPath('data.attachment.message_id', $messageId);

    $attachmentPath = $response->json('data.attachment.file_path');

    $this->assertDatabaseHas('message_attachments', [
        'message_id' => $messageId,
        'file_name' => 'document.pdf',
    ]);

    expect($attachmentPath)->not->toBeEmpty();
    Storage::disk('public')->assertExists($attachmentPath);
});

test('participant can mark messages as read', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    $unreadMessage = $conversation->messages()->create([
        'sender_id' => $professional->id,
        'message' => 'Mensagem não lida.',
        'message_type' => MessageType::Text,
    ]);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/conversations/{$conversation->id}/read");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Mensagens marcadas como lidas com sucesso.')
        ->assertJsonPath('data.messages_marked_as_read', 1);

    expect($unreadMessage->fresh()->read_at)->not->toBeNull();
});

test('mark read does not mark own sent messages', function () {
    $client = conversationClientUser();
    $professional = conversationProfessionalUser();
    $conversation = conversationCreateConversation($client, $professional);
    $ownMessage = $conversation->messages()->create([
        'sender_id' => $client->id,
        'message' => 'Mensagem do próprio cliente.',
        'message_type' => MessageType::Text,
    ]);
    $otherMessage = $conversation->messages()->create([
        'sender_id' => $professional->id,
        'message' => 'Mensagem do profissional.',
        'message_type' => MessageType::Text,
    ]);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/conversations/{$conversation->id}/read")->assertSuccessful();

    expect($ownMessage->fresh()->read_at)->toBeNull();
    expect($otherMessage->fresh()->read_at)->not->toBeNull();
});

function conversationClientUser(): User
{
    $user = User::factory()->client()->create([
        'status' => UserStatus::Active,
        'user_type' => UserType::Client,
    ]);

    Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
    $user->assignRole('client');

    return $user;
}

function conversationProfessionalUser(): User
{
    $user = User::factory()->professional()->create([
        'status' => UserStatus::Active,
        'user_type' => UserType::Professional,
    ]);

    Role::firstOrCreate(['name' => 'professional', 'guard_name' => 'web']);
    $user->assignRole('professional');

    ProfessionalProfile::factory()->create([
        'user_id' => $user->id,
    ]);

    return $user;
}

function conversationCreateServiceRequest(User $client, array $overrides = []): ServiceRequest
{
    $category = Category::factory()->create();

    return ServiceRequest::create(array_merge([
        'client_id' => $client->id,
        'category_id' => $category->id,
        'title' => 'Pedido de serviço de teste',
        'description' => 'Descrição longa o suficiente para testar a API de conversas.',
        'service_type' => 'local',
        'budget_type' => 'negotiable',
        'province' => 'Maputo',
        'city' => 'Maputo',
        'address' => 'Rua de Teste',
        'latitude' => -25.9653,
        'longitude' => 32.5892,
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ], $overrides));
}

function conversationCreateProposal(User $professional, ServiceRequest $serviceRequest, array $overrides = []): Proposal
{
    return Proposal::create(array_merge([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'delivery_days' => 7,
        'message' => 'Vou ajudar com este pedido.',
        'status' => ProposalStatus::Pending,
    ], $overrides));
}

function conversationCreateConversation(User $client, User $professional, array $overrides = []): Conversation
{
    $serviceRequest = conversationCreateServiceRequest($client);

    return Conversation::create(array_merge([
        'service_request_id' => $serviceRequest->id,
        'contract_id' => null,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'status' => ConversationStatus::Active,
    ], $overrides));
}
