<?php

use App\Enums\InvitationStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\Favorite;
use App\Models\ProfessionalInvitation;
use App\Models\ProfessionalProfile;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('client can add favorite', function () {
    $client = favoritesClientUser();
    $professional = favoritesProfessionalUser();
    Sanctum::actingAs($client);

    $response = $this->postJson('/api/v1/favorites', [
        'professional_profile_id' => $professional->professionalProfile->id,
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Profissional adicionado aos favoritos com sucesso.')
        ->assertJsonPath('data.favorite.professional_profile.id', $professional->professionalProfile->id);

    $this->assertDatabaseHas('favorites', [
        'user_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
    ]);
});

test('client cannot add duplicate favorite', function () {
    $client = favoritesClientUser();
    $professional = favoritesProfessionalUser();
    Favorite::create([
        'user_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
    ]);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/favorites', [
        'professional_profile_id' => $professional->professionalProfile->id,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Este profissional já está nos favoritos.');
});

test('client can list favorites', function () {
    $client = favoritesClientUser();
    $professional = favoritesProfessionalUser();
    Favorite::create([
        'user_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
    ]);
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/favorites');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Favoritos carregados com sucesso.')
        ->assertJsonCount(1, 'data.favorites')
        ->assertJsonPath('data.favorites.0.professional_profile.id', $professional->professionalProfile->id);
});

test('client can remove favorite', function () {
    $client = favoritesClientUser();
    $professional = favoritesProfessionalUser();
    $favorite = Favorite::create([
        'user_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
    ]);
    Sanctum::actingAs($client);

    $response = $this->deleteJson("/api/v1/favorites/{$professional->professionalProfile->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Profissional removido dos favoritos com sucesso.');

    $this->assertDatabaseMissing('favorites', [
        'id' => $favorite->id,
    ]);
});

test('professional cannot use favorites', function () {
    $professional = favoritesProfessionalUser();
    Sanctum::actingAs($professional);

    $this->getJson('/api/v1/favorites')
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a clientes.');
});

test('client cannot favorite inactive professional', function () {
    $client = favoritesClientUser();
    $professional = favoritesProfessionalUser([
        'status' => UserStatus::Inactive,
    ]);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/favorites', [
        'professional_profile_id' => $professional->professionalProfile->id,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode adicionar um profissional inactivo aos favoritos.');
});

test('client cannot favorite own professional profile', function () {
    $user = favoritesClientUser();
    ProfessionalProfile::factory()->create([
        'user_id' => $user->id,
    ]);
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/favorites', [
        'professional_profile_id' => $user->professionalProfile->id,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode adicionar o seu próprio perfil aos favoritos.');
});

test('client can invite professional to own service request', function () {
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    $professional = invitationsProfessionalUser();
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/invite", [
        'professional_profile_id' => $professional->professionalProfile->id,
        'message' => 'Gostaria de convidá-lo para este pedido.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Convite enviado com sucesso.')
        ->assertJsonPath('data.invitation.status', 'pending');

    $this->assertDatabaseHas('professional_invitations', [
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'client_id' => $client->id,
        'status' => 'pending',
    ]);
});

test('client cannot invite to another clients request', function () {
    $owner = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($owner);
    $otherClient = invitationsClientUser();
    $professional = invitationsProfessionalUser();
    Sanctum::actingAs($otherClient);

    $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/invite", [
        'professional_profile_id' => $professional->professionalProfile->id,
    ])
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado ao proprietário do pedido.');
});

test('client cannot invite duplicate professional', function () {
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    $professional = invitationsProfessionalUser();
    ProfessionalInvitation::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'client_id' => $client->id,
        'message' => 'Convite inicial.',
        'status' => InvitationStatus::Pending,
    ]);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/invite", [
        'professional_profile_id' => $professional->professionalProfile->id,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Este profissional já foi convidado para este pedido.');
});

test('client cannot invite inactive professional', function () {
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    $professional = invitationsProfessionalUser([
        'status' => UserStatus::Inactive,
    ]);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/service-requests/{$serviceRequest->id}/invite", [
        'professional_profile_id' => $professional->professionalProfile->id,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode convidar um profissional inactivo.');
});

test('professional can list own invitations', function () {
    $professional = invitationsProfessionalUser();
    $otherProfessional = invitationsProfessionalUser();
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    ProfessionalInvitation::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'client_id' => $client->id,
        'message' => 'Convite principal.',
        'status' => InvitationStatus::Pending,
    ]);
    ProfessionalInvitation::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $otherProfessional->professionalProfile->id,
        'client_id' => $client->id,
        'message' => 'Outro convite.',
        'status' => InvitationStatus::Pending,
    ]);
    Sanctum::actingAs($professional);

    $response = $this->getJson('/api/v1/professional/invitations');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Convites carregados com sucesso.')
        ->assertJsonCount(1, 'data.invitations')
        ->assertJsonPath('data.invitations.0.professional_profile.id', $professional->professionalProfile->id);
});

test('professional can decline own invitation', function () {
    $professional = invitationsProfessionalUser();
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    $invitation = ProfessionalInvitation::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'client_id' => $client->id,
        'message' => 'Convite principal.',
        'status' => InvitationStatus::Pending,
    ]);
    Sanctum::actingAs($professional);

    $response = $this->postJson("/api/v1/professional/invitations/{$invitation->id}/decline");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Convite recusado com sucesso.')
        ->assertJsonPath('data.invitation.status', 'declined');

    $this->assertDatabaseHas('professional_invitations', [
        'id' => $invitation->id,
        'status' => 'declined',
    ]);
});

test('professional cannot decline another professionals invitation', function () {
    $ownerProfessional = invitationsProfessionalUser();
    $otherProfessional = invitationsProfessionalUser();
    $client = invitationsClientUser();
    $serviceRequest = invitationsServiceRequest($client);
    $invitation = ProfessionalInvitation::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $ownerProfessional->professionalProfile->id,
        'client_id' => $client->id,
        'message' => 'Convite principal.',
        'status' => InvitationStatus::Pending,
    ]);
    Sanctum::actingAs($otherProfessional);

    $this->postJson("/api/v1/professional/invitations/{$invitation->id}/decline")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para recusar este convite.');
});

test('client cannot list professional invitations', function () {
    $client = invitationsClientUser();
    Sanctum::actingAs($client);

    $this->getJson('/api/v1/professional/invitations')
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
});

function favoritesClientUser(array $overrides = []): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
    $user->assignRole('client');

    return $user;
}

function favoritesProfessionalUser(array $userOverrides = [], array $profileOverrides = []): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
        ...$userOverrides,
    ]);
    $user->assignRole('professional');
    ProfessionalProfile::factory()->create([
        'user_id' => $user->id,
        ...$profileOverrides,
    ]);

    return $user->refresh();
}

function invitationsClientUser(array $overrides = []): User
{
    Role::findOrCreate('client');

    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
        ...$overrides,
    ]);
    $user->assignRole('client');

    return $user;
}

function invitationsProfessionalUser(array $userOverrides = [], array $profileOverrides = []): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
        ...$userOverrides,
    ]);
    $user->assignRole('professional');
    ProfessionalProfile::factory()->create([
        'user_id' => $user->id,
        ...$profileOverrides,
    ]);

    return $user->refresh();
}

function invitationsServiceRequest(User $client, array $overrides = []): ServiceRequest
{
    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => $overrides['category_id'] ?? Category::factory()->create()->id,
        'title' => 'Pedido '.fake()->unique()->numberBetween(1000, 9999),
        'description' => 'Descrição suficientemente longa para validar o pedido de serviço.',
        'service_type' => 'local',
        'budget_min' => 500,
        'budget_max' => 1500,
        'budget_type' => 'negotiable',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'address' => 'Avenida 24 de Julho',
        'latitude' => -25.9667,
        'longitude' => 32.5833,
        'deadline_at' => now()->addDays(7),
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
        ...$overrides,
    ]);
}
