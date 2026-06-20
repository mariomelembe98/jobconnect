<?php

use App\Enums\ContractStatus;
use App\Enums\DisputeStatus;
use App\Enums\NotificationType;
use App\Enums\ProposalStatus;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\Contract;
use App\Models\Dispute;
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

test('client can open dispute for own contract', function () {
    [$contract, $client] = disputeContract();
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/disputes', disputePayload($contract))
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Disputa aberta com sucesso.')
        ->assertJsonPath('data.dispute.opened_by', $client->id)
        ->assertJsonPath('data.dispute.status', DisputeStatus::Pending->value);
});

test('professional can open dispute for own contract', function () {
    [$contract, , $professional] = disputeContract();
    Sanctum::actingAs($professional);

    $this->postJson('/api/v1/disputes', disputePayload($contract))
        ->assertCreated()
        ->assertJsonPath('data.dispute.opened_by', $professional->id);
});

test('unrelated user cannot open dispute', function () {
    [$contract] = disputeContract();
    Sanctum::actingAs(disputeClient());

    $this->postJson('/api/v1/disputes', disputePayload($contract))
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para abrir uma disputa neste contrato.');
});

test('cannot open duplicate active dispute', function () {
    [$contract, $client] = disputeContract();
    Sanctum::actingAs($client);
    $this->postJson('/api/v1/disputes', disputePayload($contract))->assertCreated();

    $this->postJson('/api/v1/disputes', disputePayload($contract))
        ->assertConflict()
        ->assertJsonPath('message', 'Este contrato já possui uma disputa activa.');
});

test('opening dispute sets contract status disputed', function () {
    [$contract, $client] = disputeContract();
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/disputes', disputePayload($contract))->assertCreated();

    expect($contract->fresh()->status)->toBe(ContractStatus::Disputed);
});

test('opening dispute notifies other participant', function () {
    [$contract, $client, $professional] = disputeContract();
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/disputes', disputePayload($contract))->assertCreated();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::DisputeOpened->value,
    ]);
});

test('dispute participant can upload evidence', function () {
    Storage::fake('public');
    [$dispute, $client] = openedDispute();
    Sanctum::actingAs($client);

    $response = $this->postJson("/api/v1/disputes/{$dispute->id}/evidence", [
        'file' => UploadedFile::fake()->image('prova.png'),
        'description' => 'Captura de ecrã do problema.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.evidence.uploaded_by', $client->id);

    Storage::disk('public')->assertExists($response->json('data.evidence.file_url') === null
        ? ''
        : Dispute::findOrFail($dispute->id)->evidence()->firstOrFail()->file_path);
});

test('unrelated user cannot upload evidence', function () {
    Storage::fake('public');
    [$dispute] = openedDispute();
    Sanctum::actingAs(disputeClient());

    $this->postJson("/api/v1/disputes/{$dispute->id}/evidence", [
        'file' => UploadedFile::fake()->image('prova.png'),
    ])->assertForbidden();
});

test('dispute participant can send message', function () {
    [$dispute, , $professional] = openedDispute();
    Sanctum::actingAs($professional);

    $this->postJson("/api/v1/disputes/{$dispute->id}/messages", [
        'message' => 'Envio os detalhes adicionais para análise.',
    ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.message.sender_id', $professional->id);

    $this->assertDatabaseHas('dispute_messages', [
        'dispute_id' => $dispute->id,
        'sender_id' => $professional->id,
    ]);
});

test('admin can view dispute', function () {
    [$dispute] = openedDispute();
    Sanctum::actingAs(disputeAdmin());

    $this->getJson("/api/v1/disputes/{$dispute->id}")
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.dispute.id', $dispute->id);
});

test('user can list own disputes', function () {
    [$ownDispute, $client] = openedDispute();
    [$otherContract, $otherClient] = disputeContract();
    Dispute::create([
        'contract_id' => $otherContract->id,
        'opened_by' => $otherClient->id,
        'reason' => 'Outro problema',
        'status' => DisputeStatus::Pending,
    ]);
    Sanctum::actingAs($client);

    $this->getJson('/api/v1/disputes')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data.disputes')
        ->assertJsonPath('data.disputes.0.id', $ownDispute->id);
});

/** @return array{Contract, User, User} */
function disputeContract(ContractStatus $status = ContractStatus::Active): array
{
    $client = disputeClient();
    $professional = disputeProfessional();
    $serviceRequest = ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => Category::factory()->create()->id,
        'title' => 'Pedido para contrato em disputa',
        'description' => 'Descrição suficientemente longa para criar o pedido de serviço.',
        'service_type' => 'local',
        'budget_type' => 'negotiable',
        'province' => 'Maputo',
        'city' => 'Maputo',
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
    $proposal = Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 2500,
        'delivery_days' => 5,
        'message' => 'Proposta para contrato em disputa.',
        'status' => ProposalStatus::Accepted,
    ]);
    $contract = Contract::create([
        'service_request_id' => $serviceRequest->id,
        'proposal_id' => $proposal->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 2500,
        'platform_fee' => 250,
        'professional_amount' => 2250,
        'status' => $status,
        'started_at' => now(),
    ]);

    return [$contract, $client, $professional];
}

/** @return array{Dispute, User, User} */
function openedDispute(): array
{
    [$contract, $client, $professional] = disputeContract();
    $dispute = Dispute::create([
        'contract_id' => $contract->id,
        'opened_by' => $client->id,
        'reason' => 'Serviço contestado',
        'status' => DisputeStatus::Pending,
    ]);

    return [$dispute, $client, $professional];
}

/** @return array{contract_id: int, reason: string, description: string} */
function disputePayload(Contract $contract): array
{
    return [
        'contract_id' => $contract->id,
        'reason' => 'Serviço não entregue conforme combinado',
        'description' => 'A entrega não corresponde ao que foi acordado no contrato.',
    ];
}

function disputeClient(): User
{
    Role::findOrCreate('client');
    $user = User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
    ]);
    $user->assignRole('client');

    return $user;
}

function disputeProfessional(): User
{
    Role::findOrCreate('professional');
    $user = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
    ]);
    $user->assignRole('professional');
    ProfessionalProfile::factory()->create(['user_id' => $user->id]);

    return $user->refresh();
}

function disputeAdmin(): User
{
    Role::findOrCreate('admin');
    $user = User::factory()->admin()->create([
        'user_type' => UserType::Admin,
        'status' => UserStatus::Active,
    ]);
    $user->assignRole('admin');

    return $user;
}
