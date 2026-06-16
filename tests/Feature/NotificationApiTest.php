<?php

use App\Enums\ConversationStatus;
use App\Enums\NotificationType;
use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Conversation;
use App\Models\Notification;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('user can list own notifications', function () {
    $user = notificationUser();
    Notification::create([
        'user_id' => $user->id,
        'title' => 'Uma notificação',
        'body' => 'Corpo da notificação.',
        'type' => NotificationType::System->value,
        'data' => ['foo' => 'bar'],
        'read_at' => null,
    ]);
    Notification::create([
        'user_id' => $user->id,
        'title' => 'Outra notificação',
        'body' => null,
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => now(),
    ]);
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/notifications?read=false');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Notificações carregadas com sucesso.')
        ->assertJsonCount(1, 'data.notifications')
        ->assertJsonPath('data.notifications.0.type', 'system');
});

test('user cannot view another users notification', function () {
    $owner = notificationUser();
    $otherUser = notificationUser();
    $notification = Notification::create([
        'user_id' => $owner->id,
        'title' => 'Privada',
        'body' => 'Conteúdo privado.',
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => null,
    ]);
    Sanctum::actingAs($otherUser);

    $this->getJson("/api/v1/notifications/{$notification->id}")
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Notificação não encontrada.');
});

test('user can mark notification as read', function () {
    $user = notificationUser();
    $notification = Notification::create([
        'user_id' => $user->id,
        'title' => 'Por ler',
        'body' => 'A ler.',
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => null,
    ]);
    Sanctum::actingAs($user);

    $response = $this->postJson("/api/v1/notifications/{$notification->id}/read");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Notificação marcada como lida com sucesso.')
        ->assertJsonPath('data.notification.is_read', true);

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('user can mark all notifications as read', function () {
    $user = notificationUser();
    Notification::create([
        'user_id' => $user->id,
        'title' => 'Uma',
        'body' => null,
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => null,
    ]);
    Notification::create([
        'user_id' => $user->id,
        'title' => 'Duas',
        'body' => null,
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => null,
    ]);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/notifications/read-all')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Todas as notificações foram marcadas como lidas.');

    expect($user->notifications()->whereNull('read_at')->count())->toBe(0);
});

test('user can delete own read notification', function () {
    $user = notificationUser();
    $notification = Notification::create([
        'user_id' => $user->id,
        'title' => 'Lida',
        'body' => null,
        'type' => NotificationType::System->value,
        'data' => [],
        'read_at' => now(),
    ]);
    Sanctum::actingAs($user);

    $this->deleteJson("/api/v1/notifications/{$notification->id}")
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Notificação eliminada com sucesso.');

    $this->assertDatabaseMissing('notifications', [
        'id' => $notification->id,
    ]);
});

test('cannot delete unread critical notification', function () {
    $user = notificationUser();
    $notification = Notification::create([
        'user_id' => $user->id,
        'title' => 'Crítica',
        'body' => null,
        'type' => NotificationType::ContractCreated->value,
        'data' => [],
        'read_at' => null,
    ]);
    Sanctum::actingAs($user);

    $this->deleteJson("/api/v1/notifications/{$notification->id}")
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode eliminar uma notificação importante por ler.');
});

test('submitting proposal creates notification for client', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $serviceRequest = notificationCreateServiceRequest($client);
    Sanctum::actingAs($professional);

    $this->postJson('/api/v1/proposals', [
        'service_request_id' => $serviceRequest->id,
        'amount' => 1500,
        'delivery_days' => 7,
        'message' => 'Proposta de teste.',
    ])->assertCreated();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $client->id,
        'type' => NotificationType::ProposalReceived->value,
        'title' => 'Nova proposta recebida',
    ]);
});

test('accepting proposal creates proposal accepted and contract created notifications', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $serviceRequest = notificationCreateServiceRequest($client);
    $proposal = notificationCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();

    $professionalUserId = $professional->id;

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professionalUserId,
        'type' => NotificationType::ProposalAccepted->value,
    ]);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professionalUserId,
        'type' => NotificationType::ContractCreated->value,
    ]);
});

test('rejecting proposal creates notification for professional', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $serviceRequest = notificationCreateServiceRequest($client);
    $proposal = notificationCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$proposal->id}/reject")->assertSuccessful();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::ProposalRejected->value,
    ]);
});

test('completing contract creates notification for professional', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $serviceRequest = notificationCreateServiceRequest($client);
    $proposal = notificationCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->postJson("/api/v1/contracts/{$contract->id}/complete")->assertSuccessful();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::ContractCompleted->value,
    ]);
});

test('cancelling contract creates notification for other participant', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $serviceRequest = notificationCreateServiceRequest($client);
    $proposal = notificationCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->postJson("/api/v1/contracts/{$contract->id}/cancel")->assertSuccessful();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::ContractCancelled->value,
    ]);
});

test('sending message creates notification for recipient only', function () {
    $client = notificationClientUser();
    $professional = notificationProfessionalUser();
    $conversation = notificationCreateConversation($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
        'message' => 'Olá profissional.',
    ])->assertCreated();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::NewMessage->value,
    ]);

    $this->assertDatabaseMissing('notifications', [
        'user_id' => $client->id,
        'type' => NotificationType::NewMessage->value,
    ]);
});

test('approving verification creates notification for professional', function () {
    $admin = notificationAdminUser();
    $professional = notificationProfessionalUser();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/verifications/{$professional->professionalProfile->id}/approve")
        ->assertSuccessful();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::VerificationApproved->value,
    ]);
});

test('rejecting verification creates notification for professional', function () {
    $admin = notificationAdminUser();
    $professional = notificationProfessionalUser();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/verifications/{$professional->professionalProfile->id}/reject", [
        'reason' => 'Documentos ilegíveis e insuficientes para validação.',
    ])->assertSuccessful();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::VerificationRejected->value,
    ]);
});

function notificationUser(array $overrides = []): User
{
    $user = User::factory()->client()->create(array_merge([
        'status' => UserStatus::Active,
        'user_type' => UserType::Client,
    ], $overrides));

    Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
    $user->assignRole('client');

    return $user;
}

function notificationClientUser(array $overrides = []): User
{
    return notificationUser($overrides);
}

function notificationProfessionalUser(array $overrides = []): User
{
    $user = User::factory()->professional()->create(array_merge([
        'status' => UserStatus::Active,
        'user_type' => UserType::Professional,
    ], $overrides));

    Role::firstOrCreate(['name' => 'professional', 'guard_name' => 'web']);
    $user->assignRole('professional');

    ProfessionalProfile::factory()->create([
        'user_id' => $user->id,
    ]);

    return $user;
}

function notificationAdminUser(): User
{
    $user = User::factory()->admin()->create([
        'status' => UserStatus::Active,
        'user_type' => UserType::Admin,
    ]);

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user->assignRole('admin');

    return $user;
}

function notificationCreateServiceRequest(User $client, array $overrides = []): ServiceRequest
{
    $category = Category::factory()->create();

    return ServiceRequest::create(array_merge([
        'client_id' => $client->id,
        'category_id' => $category->id,
        'title' => 'Pedido de teste',
        'description' => 'Descrição longa o suficiente para passar na validação.',
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

function notificationCreateProposal(User $professional, ServiceRequest $serviceRequest, array $overrides = []): Proposal
{
    return Proposal::create(array_merge([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'delivery_days' => 7,
        'message' => 'Proposta automática.',
        'status' => ProposalStatus::Pending,
    ], $overrides));
}

function notificationCreateConversation(User $client, User $professional): Conversation
{
    $serviceRequest = notificationCreateServiceRequest($client);

    return Conversation::create([
        'service_request_id' => $serviceRequest->id,
        'contract_id' => null,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'status' => ConversationStatus::Active,
    ]);
}
