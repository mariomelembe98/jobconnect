<?php

use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\Contract;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('accepting proposal creates contract', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/accept");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Proposta aceite com sucesso.')
        ->assertJsonPath('data.contract.status', 'active');

    $this->assertDatabaseHas('contracts', [
        'proposal_id' => $proposal->id,
        'service_request_id' => $serviceRequest->id,
        'client_id' => $client->id,
        'status' => 'active',
    ]);
});

test('accepting proposal returns contract data', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest, [
        'amount' => 2000,
    ]);
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/proposals/{$proposal->id}/accept");

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.contract.amount', '2000.00')
        ->assertJsonPath('data.contract.platform_fee', '200.00')
        ->assertJsonPath('data.contract.professional_amount', '1800.00')
        ->assertJsonPath('data.contract.proposal_id', $proposal->id);
});

test('contract has correct amount platform fee professional amount', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest, [
        'amount' => 1000,
    ]);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();

    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    expect($contract->amount)->toBe('1000.00');
    expect($contract->platform_fee)->toBe('100.00');
    expect($contract->professional_amount)->toBe('900.00');
});

test('contract status log is created', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();

    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->assertDatabaseHas('contract_status_logs', [
        'contract_id' => $contract->id,
        'old_status' => null,
        'new_status' => 'active',
    ]);
});

test('client can list own contracts', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    Sanctum::actingAs($client);

    $response = $this->getJson('/api/v1/contracts');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Contratos carregados com sucesso.')
        ->assertJsonCount(1, 'data.contracts');
});

test('professional can list own contracts', function () {
    $client = contractClientUser();
    $professional = contractProfessionalUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    Sanctum::actingAs($professional);

    $response = $this->getJson('/api/v1/contracts');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Contratos carregados com sucesso.')
        ->assertJsonCount(1, 'data.contracts');
});

test('user cannot view unrelated contract', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    Sanctum::actingAs(contractClientUser());

    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();

    $this->getJson("/api/v1/contracts/{$contract->id}")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para ver este contrato.');
});

test('client can complete active contract', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/contracts/{$contract->id}/complete");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Contrato concluído com sucesso.')
        ->assertJsonPath('data.contract.status', 'completed');

    $this->assertDatabaseHas('contracts', [
        'id' => $contract->id,
        'status' => 'completed',
    ]);
});

test('completing contract updates service_request to completed', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/contracts/{$contract->id}/complete")->assertSuccessful();

    expect($serviceRequest->fresh()->status?->value)->toBe(ServiceRequestStatus::Completed->value);
});

test('professional cannot complete contract for now', function () {
    $client = contractClientUser();
    $professional = contractProfessionalUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($professional);

    $this->postJson("/api/v1/contracts/{$contract->id}/complete")
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Apenas o cliente proprietário pode concluir este contrato.');
});

test('client can cancel active contract', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/contracts/{$contract->id}/cancel");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Contrato cancelado com sucesso.')
        ->assertJsonPath('data.contract.status', 'cancelled');
});

test('professional can cancel own active contract', function () {
    $client = contractClientUser();
    $professional = contractProfessionalUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal($professional, $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($professional);

    $this->postJson("/api/v1/contracts/{$contract->id}/cancel")
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Contrato cancelado com sucesso.');
});

test('cannot cancel completed contract', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($client);

    $this->postJson("/api/v1/contracts/{$contract->id}/complete")->assertSuccessful();

    $this->postJson("/api/v1/contracts/{$contract->id}/cancel")
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Só é possível cancelar um contrato activo.');
});

test('can list contract logs', function () {
    $client = contractClientUser();
    $serviceRequest = contractCreateServiceRequest($client);
    $proposal = contractCreateProposal(contractProfessionalUser(), $serviceRequest);
    Sanctum::actingAs($client);
    $this->postJson("/api/v1/proposals/{$proposal->id}/accept")->assertSuccessful();
    $contract = Contract::query()->where('proposal_id', $proposal->id)->firstOrFail();
    Sanctum::actingAs($client);

    $response = $this->getJson("/api/v1/contracts/{$contract->id}/logs");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Registos do contrato carregados com sucesso.')
        ->assertJsonCount(1, 'data.logs');
});

function contractClientUser(array $overrides = []): User
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

function contractProfessionalUser(array $userOverrides = [], array $profileOverrides = []): User
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

function contractCreateServiceRequest(User $client, array $overrides = []): ServiceRequest
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

function contractCreateProposal(User $professional, ServiceRequest $serviceRequest, array $overrides = []): Proposal
{
    return Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1000,
        'delivery_days' => 5,
        'message' => 'Proposta preparada para execução imediata.',
        'status' => ProposalStatus::Pending,
        ...$overrides,
    ]);
}
