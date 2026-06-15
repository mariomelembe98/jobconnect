<?php

use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('professional can submit proposal', function () {
    $professional = proposalProfessionalUser();
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/proposals', proposalPayload($serviceRequest));

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta submetida com sucesso.')
        ->assertJsonPath('data.proposal.status', 'pending')
        ->assertJsonPath('data.proposal.service_request_id', $serviceRequest->id);

    $this->assertDatabaseHas('proposals', [
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => '1500.00',
        'status' => 'pending',
    ]);
});

test('professional without profile cannot submit proposal', function () {
    $professional = proposalProfessionalUser(withProfile: false);
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/proposals', proposalPayload($serviceRequest));

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais activos com perfil.');
});

test('professional cannot submit duplicate proposal', function () {
    $professional = proposalProfessionalUser();
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    proposalCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/proposals', proposalPayload($serviceRequest));

    $response
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Já submeteu uma proposta para este pedido.');
});

test('professional cannot submit proposal to own request', function () {
    $professional = proposalProfessionalUser();
    $serviceRequest = proposalCreateServiceRequest($professional, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/proposals', proposalPayload($serviceRequest));

    $response
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Não pode submeter proposta ao seu próprio pedido.');
});

test('client cannot submit proposal', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    Sanctum::actingAs($client);

    $response = $this->postJson('/api/v1/proposals', proposalPayload($serviceRequest));

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais activos com perfil.');
});

test('professional can list own proposals', function () {
    $professional = proposalProfessionalUser();
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $ownProposal = proposalCreateProposal($professional, $serviceRequest);
    $otherProfessional = proposalProfessionalUser();
    proposalCreateProposal($otherProfessional, $serviceRequest);
    Sanctum::actingAs($professional);

    $response = $this->getJson('/api/v1/professional/proposals');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Propostas carregadas com sucesso.')
        ->assertJsonCount(1, 'data.proposals')
        ->assertJsonPath('data.proposals.0.id', $ownProposal->id);
});

test('request owner can list proposals for request', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->getJson("/api/v1/service-requests/{$serviceRequest->id}/proposals");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Propostas carregadas com sucesso.')
        ->assertJsonCount(2, 'data.proposals');
});

test('non-owner cannot list proposals for request', function () {
    $owner = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($owner, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs(proposalClientUser());

    $response = $this->getJson("/api/v1/service-requests/{$serviceRequest->id}/proposals");

    $response
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado ao proprietário do pedido.');
});

test('professional can withdraw pending proposal', function () {
    $professional = proposalProfessionalUser();
    $serviceRequest = proposalCreateServiceRequest(proposalClientUser(), [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $proposal = proposalCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($professional);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/withdraw");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta retirada com sucesso.')
        ->assertJsonPath('data.proposal.status', 'withdrawn');

    $this->assertDatabaseHas('proposals', [
        'id' => $proposal->id,
        'status' => 'withdrawn',
    ]);
    $this->assertNotNull($proposal->fresh()->withdrawn_at);
});

test('request owner can accept pending proposal', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $acceptedProposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    $otherProposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$acceptedProposal->id}/accept");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta aceite com sucesso.')
        ->assertJsonPath('data.proposal.status', 'accepted');

    $this->assertDatabaseHas('proposals', [
        'id' => $acceptedProposal->id,
        'status' => 'accepted',
    ]);
    $this->assertDatabaseHas('proposals', [
        'id' => $otherProposal->id,
        'status' => 'rejected',
    ]);
    $this->assertDatabaseHas('service_requests', [
        'id' => $serviceRequest->id,
        'status' => 'in_progress',
    ]);
});

test('accepting proposal rejects other pending proposals', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $acceptedProposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    $rejectedProposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$acceptedProposal->id}/accept")->assertSuccessful();

    expect($rejectedProposal->fresh()->status?->value)->toBe(ProposalStatus::Rejected->value);
    expect($rejectedProposal->fresh()->rejected_at)->not->toBeNull();
});

test('accepting proposal updates service request to in_progress', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $proposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();

    expect($serviceRequest->fresh()->status?->value)->toBe(ServiceRequestStatus::InProgress->value);
});

test('request owner can reject pending proposal', function () {
    $client = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($client, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $proposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/reject");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta rejeitada com sucesso.')
        ->assertJsonPath('data.proposal.status', 'rejected');

    $this->assertDatabaseHas('proposals', [
        'id' => $proposal->id,
        'status' => 'rejected',
    ]);
});

test('non-owner cannot accept or reject proposal', function () {
    $owner = proposalClientUser();
    $serviceRequest = proposalCreateServiceRequest($owner, [
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $proposal = proposalCreateProposal(proposalProfessionalUser(), $serviceRequest);
    $otherClient = proposalClientUser();
    Sanctum::actingAs($otherClient);

    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado ao proprietário do pedido.');

    $this->postJson("/api/v1/proposals/{$proposal->id}/reject")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado ao proprietário do pedido.');
});

function proposalPayload(ServiceRequest $serviceRequest, array $overrides = []): array
{
    return [
        'service_request_id' => $serviceRequest->id,
        'amount' => 1500,
        'delivery_days' => 5,
        'message' => 'Tenho experiência suficiente para concluir este trabalho com qualidade.',
        ...$overrides,
    ];
}

function proposalClientUser(array $overrides = []): User
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

function proposalProfessionalUser(bool $withProfile = true, array $userOverrides = [], array $profileOverrides = []): User
{
    Role::findOrCreate('professional');

    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
        ...$userOverrides,
    ]);
    $user->assignRole('professional');

    if ($withProfile) {
        ProfessionalProfile::factory()->create([
            'user_id' => $user->id,
            ...$profileOverrides,
        ]);
    }

    return $user->refresh();
}

function proposalCreateServiceRequest(User $owner, array $overrides = []): ServiceRequest
{
    $category = Category::factory()->create();

    return ServiceRequest::create([
        'client_id' => $owner->id,
        'category_id' => $overrides['category_id'] ?? $category->id,
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

function proposalCreateProposal(User $professional, ServiceRequest $serviceRequest, array $overrides = []): Proposal
{
    return Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'delivery_days' => 5,
        'message' => 'Proposta preparada para execução imediata.',
        'status' => ProposalStatus::Pending,
        ...$overrides,
    ]);
}
