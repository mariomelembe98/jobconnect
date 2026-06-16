<?php

use App\Enums\ContractStatus;
use App\Enums\NotificationType;
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

test('client can review professional after contract completed', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);

    $response = $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
        'comment' => 'Excelente serviço.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Avaliação criada com sucesso.')
        ->assertJsonPath('data.review.rating', 5)
        ->assertJsonPath('data.review.reviewed_id', $professional->id);
});

test('professional can review client after contract completed', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($professional);

    $response = $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 4,
        'comment' => 'Cliente colaborou bem.',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.review.reviewed_id', $client->id);
});

test('cannot review active contract', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateActiveContract($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Só é possível avaliar contratos concluídos.');
});

test('unrelated user cannot review contract', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs(reviewClientUser());

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Sem permissão para avaliar este contrato.');
});

test('user cannot review same contract twice', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])->assertCreated();

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 4,
    ])
        ->assertConflict()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Já avaliou este contrato.');
});

test('review creation updates professional average rating and total reviews', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 4,
    ])->assertCreated();

    expect($professional->professionalProfile->fresh()->average_rating)->toBe('4.00');
    expect($professional->professionalProfile->fresh()->total_reviews)->toBe(1);
});

test('review creation creates notification for reviewed user', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);

    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])->assertCreated();

    $this->assertDatabaseHas('notifications', [
        'user_id' => $professional->id,
        'type' => NotificationType::ReviewReceived->value,
    ]);
});

test('user can list own reviews', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);
    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])->assertCreated();

    $response = $this->getJson('/api/v1/reviews/me');

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Avaliações carregadas com sucesso.')
        ->assertJsonCount(1, 'data.reviews');
});

test('public can list reviews for professional', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);
    $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])->assertCreated();

    Sanctum::actingAs(reviewClientUser());

    $response = $this->getJson("/api/v1/professionals/{$professional->professionalProfile->id}/reviews");

    $response
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Avaliações carregadas com sucesso.')
        ->assertJsonCount(1, 'data.reviews');
});

test('admin can view review details', function () {
    $client = reviewClientUser();
    $professional = reviewProfessionalUser();
    $contract = reviewCreateCompletedContract($client, $professional);
    Sanctum::actingAs($client);
    $reviewResponse = $this->postJson('/api/v1/reviews', [
        'contract_id' => $contract->id,
        'rating' => 5,
    ])->assertCreated();
    $reviewId = $reviewResponse->json('data.review.id');
    Sanctum::actingAs(reviewAdminUser());

    $this->getJson("/api/v1/reviews/{$reviewId}")
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Avaliação carregada com sucesso.')
        ->assertJsonPath('data.review.id', $reviewId);
});

function reviewClientUser(array $overrides = []): User
{
    $user = User::factory()->client()->create(array_merge([
        'status' => UserStatus::Active,
        'user_type' => UserType::Client,
    ], $overrides));

    Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
    $user->assignRole('client');

    return $user;
}

function reviewProfessionalUser(array $overrides = []): User
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

function reviewAdminUser(): User
{
    $user = User::factory()->admin()->create([
        'status' => UserStatus::Active,
        'user_type' => UserType::Admin,
    ]);

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user->assignRole('admin');

    return $user;
}

function reviewCreateCompletedContract(User $client, User $professional): Contract
{
    $serviceRequest = reviewCreateServiceRequest($client);
    $proposal = reviewCreateProposal($professional, $serviceRequest);

    return Contract::create([
        'service_request_id' => $serviceRequest->id,
        'proposal_id' => $proposal->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'platform_fee' => 150,
        'professional_amount' => 1350,
        'status' => ContractStatus::Completed,
        'started_at' => now()->subDay(),
        'completed_at' => now(),
    ]);
}

function reviewCreateActiveContract(User $client, User $professional): Contract
{
    $serviceRequest = reviewCreateServiceRequest($client);
    $proposal = reviewCreateProposal($professional, $serviceRequest);

    return Contract::create([
        'service_request_id' => $serviceRequest->id,
        'proposal_id' => $proposal->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'platform_fee' => 150,
        'professional_amount' => 1350,
        'status' => ContractStatus::Active,
        'started_at' => now(),
    ]);
}

function reviewCreateServiceRequest(User $client): ServiceRequest
{
    $category = Category::factory()->create();

    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => $category->id,
        'title' => 'Pedido de avaliação',
        'description' => 'Descrição suficientemente longa para passar na validação.',
        'service_type' => 'local',
        'budget_type' => 'negotiable',
        'province' => 'Maputo',
        'city' => 'Maputo',
        'address' => 'Rua de Teste',
        'latitude' => -25.9653,
        'longitude' => 32.5892,
        'status' => ServiceRequestStatus::Published,
        'visibility' => 'public',
    ]);
}

function reviewCreateProposal(User $professional, ServiceRequest $serviceRequest): Proposal
{
    return Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 1500,
        'delivery_days' => 7,
        'message' => 'Proposta para avaliação.',
        'status' => ProposalStatus::Pending,
    ]);
}
