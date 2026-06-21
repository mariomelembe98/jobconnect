<?php

use App\Enums\ContractStatus;
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

test('professional with profile can fetch dashboard summary', function () {
    $professional = dashboardProfessional();
    $professional->professionalProfile->update(['average_rating' => 4.75]);
    $client = dashboardClient();

    dashboardServiceRequest($client, ServiceRequestStatus::Published);
    dashboardServiceRequest($client, ServiceRequestStatus::ReceivingProposals);
    dashboardServiceRequest($client, ServiceRequestStatus::Draft);
    dashboardServiceRequest($professional, ServiceRequestStatus::Published);

    dashboardProposal($professional, dashboardServiceRequest($client), ProposalStatus::Pending);
    dashboardProposal($professional, dashboardServiceRequest($client), ProposalStatus::Accepted);

    Sanctum::actingAs($professional);

    $this->getJson('/api/v1/professional/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Painel profissional carregado com sucesso.')
        ->assertJsonPath('data.available_jobs', 4)
        ->assertJsonPath('data.submitted_proposals', 2)
        ->assertJsonPath('data.accepted_proposals', 1)
        ->assertJsonPath('data.active_contracts', 0)
        ->assertJsonPath('data.monthly_earnings', 0)
        ->assertJsonPath('data.average_rating', 4.75);
});

test('professional without profile receives not found response', function () {
    $professional = dashboardProfessional(withProfile: false);
    Sanctum::actingAs($professional);

    $this->getJson('/api/v1/professional/dashboard')
        ->assertNotFound()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Perfil profissional não encontrado.');
});

test('client cannot access professional dashboard', function () {
    Sanctum::actingAs(dashboardClient());

    $this->getJson('/api/v1/professional/dashboard')
        ->assertForbidden()
        ->assertJsonPath('success', false)
        ->assertJsonPath('message', 'Acesso reservado a profissionais.');
});

test('active contracts count includes active and disputed contracts only', function () {
    $professional = dashboardProfessional();
    dashboardContract($professional, ContractStatus::Active);
    dashboardContract($professional, ContractStatus::Disputed);
    dashboardContract($professional, ContractStatus::Completed, now());
    dashboardContract($professional, ContractStatus::Cancelled);
    dashboardContract(dashboardProfessional(), ContractStatus::Active);
    Sanctum::actingAs($professional);

    $this->getJson('/api/v1/professional/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('data.active_contracts', 2);
});

test('monthly earnings count only completed contracts in current calendar month', function () {
    $professional = dashboardProfessional();
    dashboardContract($professional, ContractStatus::Completed, now()->startOfMonth(), 1000);
    dashboardContract($professional, ContractStatus::Completed, now()->endOfMonth(), 2500);
    dashboardContract($professional, ContractStatus::Completed, now()->subMonthNoOverflow(), 9000);
    dashboardContract($professional, ContractStatus::Active, now(), 4000);
    dashboardContract(dashboardProfessional(), ContractStatus::Completed, now(), 8000);
    Sanctum::actingAs($professional);

    $this->getJson('/api/v1/professional/dashboard')
        ->assertSuccessful()
        ->assertJsonPath('data.monthly_earnings', 3500);
});

function dashboardProfessional(bool $withProfile = true): User
{
    Role::findOrCreate('professional');
    $professional = User::factory()->professional()->create([
        'user_type' => UserType::Professional,
        'status' => UserStatus::Active,
    ]);
    $professional->assignRole('professional');

    if ($withProfile) {
        ProfessionalProfile::factory()->for($professional)->create();
    }

    return $professional->refresh();
}

function dashboardClient(): User
{
    Role::findOrCreate('client');
    $client = User::factory()->client()->create([
        'user_type' => UserType::Client,
        'status' => UserStatus::Active,
    ]);
    $client->assignRole('client');

    return $client;
}

function dashboardServiceRequest(User $client, ServiceRequestStatus $status = ServiceRequestStatus::Published): ServiceRequest
{
    return ServiceRequest::create([
        'client_id' => $client->id,
        'category_id' => Category::factory()->create()->id,
        'title' => 'Pedido para o painel profissional',
        'description' => 'Descrição suficientemente detalhada para testar o painel profissional.',
        'service_type' => 'local',
        'budget_type' => 'negotiable',
        'province' => 'Maputo Cidade',
        'city' => 'KaMpfumo',
        'status' => $status,
        'visibility' => 'public',
    ]);
}

function dashboardProposal(User $professional, ServiceRequest $serviceRequest, ProposalStatus $status): Proposal
{
    return Proposal::create([
        'service_request_id' => $serviceRequest->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 5000,
        'delivery_days' => 5,
        'message' => 'Proposta criada para testar o painel profissional.',
        'status' => $status,
        'accepted_at' => $status === ProposalStatus::Accepted ? now() : null,
    ]);
}

function dashboardContract(
    User $professional,
    ContractStatus $status,
    ?DateTimeInterface $completedAt = null,
    float $professionalAmount = 2700,
): Contract {
    $client = dashboardClient();
    $serviceRequest = dashboardServiceRequest($client, ServiceRequestStatus::InProgress);
    $proposal = dashboardProposal($professional, $serviceRequest, ProposalStatus::Accepted);

    return Contract::create([
        'service_request_id' => $serviceRequest->id,
        'proposal_id' => $proposal->id,
        'client_id' => $client->id,
        'professional_profile_id' => $professional->professionalProfile->id,
        'amount' => 3000,
        'platform_fee' => 300,
        'professional_amount' => $professionalAmount,
        'status' => $status,
        'started_at' => now()->subWeek(),
        'completed_at' => $completedAt,
        'cancelled_at' => $status === ContractStatus::Cancelled ? now() : null,
    ]);
}
