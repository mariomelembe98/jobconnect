<?php

namespace Database\Seeders;

use App\Enums\AvailabilityStatus;
use App\Enums\ContractStatus;
use App\Enums\ConversationStatus;
use App\Enums\DisputeResolution;
use App\Enums\DisputeStatus;
use App\Enums\InvitationStatus;
use App\Enums\MessageType;
use App\Enums\NotificationType;
use App\Enums\ProposalStatus;
use App\Enums\ReportReason;
use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\ServiceRequestStatus;
use App\Enums\UserStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Category;
use App\Models\Contract;
use App\Models\ContractStatusLog;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\DisputeEvidence;
use App\Models\DisputeMessage;
use App\Models\Notification;
use App\Models\ProfessionalDocument;
use App\Models\ProfessionalInvitation;
use App\Models\ProfessionalPortfolioItem;
use App\Models\ProfessionalProfile;
use App\Models\Proposal;
use App\Models\Report;
use App\Models\Review;
use App\Models\ServiceRequest;
use App\Models\ServiceRequestAttachment;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        if (! app()->isLocal() && ! app()->runningUnitTests()) {
            throw new RuntimeException('DemoSeeder is intended for local and demo environments only.');
        }

        $this->ensureReferenceData();
        $this->cleanupExistingDemoData();

        DB::transaction(function (): void {
            $admin = $this->upsertAdmin();
            $clients = $this->createClients();
            $professionals = $this->createProfessionals();
            $references = $this->loadReferences();

            $profiles = $this->createProfessionalProfiles($professionals, $references);
            $this->createProfessionalAssets($profiles, $admin, $references);

            $serviceRequests = $this->createServiceRequests($clients, $references);
            $proposals = $this->createProposals($serviceRequests, $profiles);
            $contracts = $this->createContracts($serviceRequests, $proposals, $clients, $admin, $profiles);

            $this->createContractsEvidence($contracts, $clients, $professionals, $admin);
            $this->createReviews($contracts, $clients, $professionals);
            $this->refreshProfessionalMetrics($profiles);
            $this->createNotifications($serviceRequests, $proposals, $contracts, $profiles, $clients, $admin);
            $this->createReports($clients, $professionals, $serviceRequests, $contracts, $admin);
            $this->createDispute($contracts['disputed_canalizacao'], $clients[3], $professionals[2], $admin);
            $this->createInvitations($serviceRequests, $profiles, $clients);
        });
    }

    /**
     * Ensure the reference lookup data exists when the seeder is run directly.
     */
    private function ensureReferenceData(): void
    {
        if (! Category::query()->exists()) {
            $this->call(CategorySeeder::class);
        }

        if (! Skill::query()->exists()) {
            $this->call(SkillSeeder::class);
        }

        if (! $this->rolesExist()) {
            $this->call(RoleSeeder::class);
        }
    }

    private function rolesExist(): bool
    {
        return class_exists(\Spatie\Permission\Models\Role::class)
            && \Spatie\Permission\Models\Role::query()->exists();
    }

    private function cleanupExistingDemoData(): void
    {
        Storage::disk('local')->deleteDirectory('demo');

        User::query()
            ->where('email', 'like', '%@demo.tempoconect.local')
            ->get()
            ->each(static fn (User $user) => $user->delete());
    }

    private function upsertAdmin(): User
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@tempoconnect.local'],
            [
                'name' => 'Administrador Demo',
                'phone' => '+258840000000',
                'password' => Hash::make('password'),
                'user_type' => UserType::Admin->value,
                'status' => UserStatus::Active->value,
                'email_verified_at' => now()->subDays(30),
                'phone_verified_at' => now()->subDays(30),
            ],
        );

        if (method_exists($admin, 'assignRole')) {
            $admin->syncRoles(['super_admin']);
        }

        return $admin;
    }

    /**
     * @return array<int, User>
     */
    private function createClients(): array
    {
        $clients = [];

        foreach ($this->clientDefinitions() as $definition) {
            $clients[] = User::updateOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'phone' => $definition['phone'],
                    'password' => Hash::make('password'),
                    'user_type' => UserType::Client->value,
                    'status' => UserStatus::Active->value,
                    'province' => $definition['province'],
                    'city' => $definition['city'],
                    'address' => $definition['address'],
                    'email_verified_at' => now()->subDays(21),
                    'phone_verified_at' => now()->subDays(21),
                ],
            );
        }

        foreach ($clients as $client) {
            $client->syncRoles(['client']);
        }

        return $clients;
    }

    /**
     * @return array<int, User>
     */
    private function createProfessionals(): array
    {
        $professionals = [];

        foreach ($this->professionalDefinitions() as $definition) {
            $professionals[] = User::updateOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'phone' => $definition['phone'],
                    'password' => Hash::make('password'),
                    'user_type' => UserType::Professional->value,
                    'status' => UserStatus::Active->value,
                    'province' => $definition['province'],
                    'city' => $definition['city'],
                    'address' => $definition['address'],
                    'email_verified_at' => now()->subDays(18),
                    'phone_verified_at' => now()->subDays(18),
                ],
            );
        }

        foreach ($professionals as $professional) {
            $professional->syncRoles(['professional']);
        }

        return $professionals;
    }

    /**
     * @param  array<int, User>  $professionals
     * @return array<int, ProfessionalProfile>
     */
    private function createProfessionalProfiles(array $professionals, array $references): array
    {
        $profiles = [];

        foreach ($professionals as $index => $professional) {
            $definition = $this->professionalDefinitions()[$index];
            $profile = ProfessionalProfile::updateOrCreate(
                ['user_id' => $professional->id],
                [
                    'headline' => $definition['headline'],
                    'bio' => $definition['bio'],
                    'experience_years' => $definition['experience_years'],
                    'base_price' => $definition['base_price'],
                    'price_type' => $definition['price_type'],
                    'province' => $definition['province'],
                    'city' => $definition['city'],
                    'address' => $definition['profile_address'],
                    'latitude' => $definition['latitude'],
                    'longitude' => $definition['longitude'],
                    'verification_status' => $definition['verification_status']->value,
                    'availability' => $definition['availability']->value,
                    'average_rating' => 0,
                    'total_reviews' => 0,
                ],
            );

            $profile->categories()->sync($this->categoryIdsFor($definition['categories'], $references));
            $profile->skills()->sync($this->skillIdsForCategories($definition['skill_categories'], $references));

            $profiles[] = $profile;
        }

        return $profiles;
    }

    /**
     * @param  array<int, ProfessionalProfile>  $profiles
     * @param  array<int, User>  $professionals
     */
    private function createProfessionalAssets(array $profiles, User $admin, array $references): void
    {
        foreach ($profiles as $index => $profile) {
            $definition = $this->professionalDefinitions()[$index];

            foreach (range(1, $definition['portfolio_count']) as $itemIndex) {
                $relativePath = "demo/portfolio/{$profile->id}/portfolio-{$itemIndex}.jpg";
                $contents = "Demo portfolio item {$itemIndex} for {$definition['name']}.";
                $this->storeDemoFile($relativePath, $contents);

                ProfessionalPortfolioItem::updateOrCreate(
                    [
                        'professional_profile_id' => $profile->id,
                        'file_path' => $relativePath,
                    ],
                    [
                        'title' => "{$definition['name']} - Projecto {$itemIndex}",
                        'description' => "Exemplo de trabalho para {$definition['name']}.",
                        'file_name' => "portfolio-{$itemIndex}.jpg",
                        'file_type' => 'image/jpeg',
                        'file_size' => strlen($contents),
                    ],
                );
            }

            foreach ($definition['documents'] as $documentDefinition) {
                $relativePath = "demo/verification-documents/{$profile->id}/{$documentDefinition['file_name']}";
                $contents = "Demo verification document {$documentDefinition['document_type']} for {$definition['name']}.";
                $this->storeDemoFile($relativePath, $contents);

                ProfessionalDocument::updateOrCreate(
                    [
                        'professional_profile_id' => $profile->id,
                        'document_type' => $documentDefinition['document_type'],
                        'file_path' => $relativePath,
                    ],
                    [
                        'file_name' => $documentDefinition['file_name'],
                        'file_type' => 'application/pdf',
                        'file_size' => strlen($contents),
                        'status' => $documentDefinition['status']->value,
                        'reviewed_by' => $documentDefinition['status'] === VerificationStatus::Pending ? null : $admin->id,
                        'reviewed_at' => $documentDefinition['status'] === VerificationStatus::Pending ? null : now()->subDays(3),
                        'rejection_reason' => $documentDefinition['rejection_reason'] ?? null,
                    ],
                );
            }
        }
    }

    /**
     * @param  array<int, User>  $clients
     * @return array<int, ServiceRequest>
     */
    private function createServiceRequests(array $clients, array $references): array
    {
        $serviceRequests = [];

        foreach ($this->serviceRequestDefinitions() as $index => $definition) {
            $client = $clients[$definition['client_index']];
            $categoryId = $references['categories'][$definition['category']];

            $serviceRequest = ServiceRequest::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'title' => $definition['title'],
                ],
                [
                    'category_id' => $categoryId,
                    'description' => $definition['description'],
                    'service_type' => $definition['service_type'],
                    'budget_min' => $definition['budget_min'],
                    'budget_max' => $definition['budget_max'],
                    'budget_type' => $definition['budget_type'],
                    'province' => $definition['province'],
                    'city' => $definition['city'],
                    'address' => $definition['address'],
                    'latitude' => $definition['latitude'],
                    'longitude' => $definition['longitude'],
                    'deadline_at' => $definition['deadline_at'],
                    'status' => $definition['status']->value,
                    'visibility' => 'public',
                ],
            );

            $serviceRequests[$definition['key']] = $serviceRequest;

            foreach ($definition['attachments'] as $attachmentIndex => $attachmentDefinition) {
                $attachmentPath = "demo/service-requests/{$serviceRequest->id}/{$attachmentDefinition['file_name']}";
                $contents = "Demo attachment {$attachmentIndex} for {$definition['title']}.";
                $this->storeDemoFile($attachmentPath, $contents);

                ServiceRequestAttachment::updateOrCreate(
                    [
                        'service_request_id' => $serviceRequest->id,
                        'file_path' => $attachmentPath,
                    ],
                    [
                        'file_name' => $attachmentDefinition['file_name'],
                        'file_type' => $attachmentDefinition['file_type'],
                        'file_size' => strlen($contents),
                    ],
                );
            }
        }

        return $serviceRequests;
    }

    /**
     * @param  array<string, ServiceRequest>  $serviceRequests
     * @param  array<int, ProfessionalProfile>  $profiles
     * @return array<string, Proposal>
     */
    private function createProposals(array $serviceRequests, array $profiles): array
    {
        $proposals = [];

        foreach ($this->proposalDefinitions() as $definition) {
            $proposal = Proposal::updateOrCreate(
                [
                    'service_request_id' => $serviceRequests[$definition['service_request_key']]->id,
                    'professional_profile_id' => $profiles[$definition['professional_index']]->id,
                ],
                [
                    'amount' => $definition['amount'],
                    'delivery_days' => $definition['delivery_days'],
                    'message' => $definition['message'],
                    'status' => $definition['status']->value,
                    'accepted_at' => $definition['status'] === ProposalStatus::Accepted ? now()->subDays(2) : null,
                    'rejected_at' => $definition['status'] === ProposalStatus::Rejected ? now()->subDays(2) : null,
                    'withdrawn_at' => $definition['status'] === ProposalStatus::Withdrawn ? now()->subDays(2) : null,
                ],
            );

            $proposals[$definition['key']] = $proposal;
        }

        return $proposals;
    }

    /**
     * @param  array<string, ServiceRequest>  $serviceRequests
     * @param  array<string, Proposal>  $proposals
     * @param  array<int, User>  $clients
     * @param  array<int, User>  $professionals
     * @param  array<int, ProfessionalProfile>  $profiles
     * @return array<string, Contract>
     */
    private function createContracts(
        array $serviceRequests,
        array $proposals,
        array $clients,
        User $admin,
        array $profiles,
    ): array {
        $contracts = [];

        foreach ($this->contractDefinitions() as $definition) {
            $serviceRequest = $serviceRequests[$definition['service_request_key']];
            $proposal = $proposals[$definition['proposal_key']];
            $professionalProfile = $profiles[$definition['professional_index']];

            $contract = Contract::updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'service_request_id' => $serviceRequest->id,
                    'client_id' => $clients[$definition['client_index']]->id,
                    'professional_profile_id' => $professionalProfile->id,
                    'amount' => $definition['amount'],
                    'platform_fee' => round($definition['amount'] * 0.1, 2),
                    'professional_amount' => round($definition['amount'] * 0.9, 2),
                    'status' => $definition['status']->value,
                    'started_at' => $definition['started_at'],
                    'completed_at' => $definition['completed_at'],
                    'cancelled_at' => $definition['cancelled_at'],
                ],
            );

            $serviceRequest->update([
                'status' => $definition['service_request_status']->value,
            ]);

            $proposal->update([
                'status' => ProposalStatus::Accepted->value,
                'accepted_at' => $definition['accepted_at'] ?? now()->subDays(5),
                'rejected_at' => null,
                'withdrawn_at' => null,
            ]);

            ContractStatusLog::updateOrCreate(
                [
                    'contract_id' => $contract->id,
                    'new_status' => $definition['log_statuses'][0],
                ],
                [
                    'old_status' => null,
                    'changed_by' => $clients[$definition['client_index']]->id,
                    'note' => $definition['log_notes'][0],
                ],
            );

            if (count($definition['log_statuses']) > 1) {
                ContractStatusLog::updateOrCreate(
                    [
                        'contract_id' => $contract->id,
                        'new_status' => $definition['log_statuses'][1],
                    ],
                    [
                        'old_status' => $definition['log_statuses'][0],
                        'changed_by' => $admin->id,
                        'note' => $definition['log_notes'][1],
                    ],
                );
            }

            $contracts[$definition['key']] = $contract;
        }

        return $contracts;
    }

    /**
     * @param  array<string, Contract>  $contracts
     * @param  array<int, User>  $clients
     * @param  array<int, User>  $professionals
     */
    private function createContractsEvidence(array $contracts, array $clients, array $professionals, User $admin): void
    {
        $completedContract = $contracts['completed_maputo'];
        $activeContract = $contracts['active_wi_fi'];
        $disputedContract = $contracts['disputed_canalizacao'];

        $completedConversation = Conversation::updateOrCreate(
            ['contract_id' => $completedContract->id],
            [
                'service_request_id' => $completedContract->service_request_id,
                'client_id' => $completedContract->client_id,
                'professional_profile_id' => $completedContract->professional_profile_id,
                'status' => ConversationStatus::Active->value,
            ],
        );

        $activeConversation = Conversation::updateOrCreate(
            ['contract_id' => $activeContract->id],
            [
                'service_request_id' => $activeContract->service_request_id,
                'client_id' => $activeContract->client_id,
                'professional_profile_id' => $activeContract->professional_profile_id,
                'status' => ConversationStatus::Active->value,
            ],
        );

        $disputedConversation = Conversation::updateOrCreate(
            ['contract_id' => $disputedContract->id],
            [
                'service_request_id' => $disputedContract->service_request_id,
                'client_id' => $disputedContract->client_id,
                'professional_profile_id' => $disputedContract->professional_profile_id,
                'status' => ConversationStatus::Active->value,
            ],
        );

        $this->storeConversationMessages($completedConversation, [
            ['sender_id' => $clients[1]->id, 'message' => 'O serviço ficou muito profissional. Obrigado!'],
            ['sender_id' => $professionals[1]->id, 'message' => 'Obrigado, fico disponível para qualquer ajuste adicional.'],
        ]);

        $this->storeConversationMessages($activeConversation, [
            ['sender_id' => $professionals[0]->id, 'message' => 'Já estou a caminho para fazer a instalação.'],
            ['sender_id' => $clients[0]->id, 'message' => 'Perfeito, vou aguardar aqui.'],
        ]);

        $this->storeConversationMessages($disputedConversation, [
            ['sender_id' => $clients[3]->id, 'message' => 'Ainda não recebi a solução combinada.'],
            ['sender_id' => $professionals[2]->id, 'message' => 'Estou a preparar o material para concluir hoje.'],
        ]);

        $this->storeDisputeEvidence($disputedContract, $admin);
    }

    /**
     * @param  array<string, Contract>  $contracts
     * @param  array<int, User>  $clients
     * @param  array<int, User>  $professionals
     */
    private function createReviews(array $contracts, array $clients, array $professionals): void
    {
        Review::updateOrCreate(
            [
                'contract_id' => $contracts['completed_maputo']->id,
                'reviewer_id' => $clients[1]->id,
            ],
            [
                'reviewed_id' => $professionals[1]->id,
                'rating' => 5,
                'comment' => 'Muito pontual e transparente durante todo o processo.',
            ],
        );

        Review::updateOrCreate(
            [
                'contract_id' => $contracts['completed_design']->id,
                'reviewer_id' => $clients[2]->id,
            ],
            [
                'reviewed_id' => $professionals[4]->id,
                'rating' => 4,
                'comment' => 'Bom resultado final e boa comunicação.',
            ],
        );
    }

    /**
     * @param  array<int, ProfessionalProfile>  $profiles
     */
    private function refreshProfessionalMetrics(array $profiles): void
    {
        foreach ($profiles as $profile) {
            $aggregate = Review::query()
                ->where('reviewed_id', $profile->user_id)
                ->selectRaw('COUNT(*) as total_reviews, AVG(rating) as average_rating')
                ->first();

            $profile->update([
                'total_reviews' => (int) ($aggregate?->total_reviews ?? 0),
                'average_rating' => round((float) ($aggregate?->average_rating ?? 0), 2),
            ]);
        }
    }

    /**
     * @param  array<string, ServiceRequest>  $serviceRequests
     * @param  array<string, Proposal>  $proposals
     * @param  array<string, Contract>  $contracts
     * @param  array<int, ProfessionalProfile>  $profiles
     * @param  array<int, User>  $clients
     */
    private function createNotifications(array $serviceRequests, array $proposals, array $contracts, array $profiles, array $clients, User $admin): void
    {
        $notifications = [
            [
                'user_id' => $clients[0]->id,
                'type' => NotificationType::ProposalReceived->value,
                'title' => 'Nova proposta recebida',
                'body' => 'Recebeu uma nova proposta para o seu pedido de Internet doméstica.',
                'data' => [
                    'proposal_id' => $proposals['wifi_afonso']->id,
                    'service_request_id' => $serviceRequests['wifi_home']->id,
                ],
            ],
            [
                'user_id' => $profiles[0]->user_id,
                'type' => NotificationType::ContractCreated->value,
                'title' => 'Contrato criado',
                'body' => 'O cliente aceitou a sua proposta.',
                'data' => [
                    'contract_id' => $contracts['active_wi_fi']->id,
                    'service_request_id' => $serviceRequests['wifi_home']->id,
                ],
            ],
            [
                'user_id' => $profiles[1]->user_id,
                'type' => NotificationType::ContractCompleted->value,
                'title' => 'Contrato concluído',
                'body' => 'O cliente concluiu o contrato e deixou uma avaliação.',
                'data' => [
                    'contract_id' => $contracts['completed_maputo']->id,
                ],
            ],
            [
                'user_id' => $profiles[2]->user_id,
                'type' => NotificationType::DisputeOpened->value,
                'title' => 'Disputa aberta',
                'body' => 'Foi aberta uma disputa no seu contrato.',
                'data' => [
                    'contract_id' => $contracts['disputed_canalizacao']->id,
                ],
            ],
            [
                'user_id' => $profiles[4]->user_id,
                'type' => NotificationType::ReviewReceived->value,
                'title' => 'Nova avaliação recebida',
                'body' => 'Recebeu uma avaliação de 4 estrelas.',
                'data' => [
                    'review_id' => Review::query()->where('reviewed_id', $profiles[4]->user_id)->value('id'),
                ],
            ],
            [
                'user_id' => $clients[4]->id,
                'type' => NotificationType::NewMessage->value,
                'title' => 'Nova mensagem',
                'body' => 'Tem uma resposta nova sobre o seu pedido.',
                'data' => [
                    'conversation_id' => Conversation::query()
                        ->where('contract_id', $contracts['active_wi_fi']->id)
                        ->value('id'),
                ],
            ],
            [
                'user_id' => $admin->id,
                'type' => NotificationType::VerificationApproved->value,
                'title' => 'Verificação aprovada',
                'body' => 'Uma verificação profissional foi aprovada.',
                'data' => [
                    'professional_profile_id' => $profiles[0]->id,
                ],
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::updateOrCreate(
                [
                    'user_id' => $notification['user_id'],
                    'type' => $notification['type'],
                    'title' => $notification['title'],
                ],
                [
                    'body' => $notification['body'],
                    'data' => $notification['data'],
                    'read_at' => fake()->boolean(40) ? now()->subHour() : null,
                ],
            );
        }
    }

    /**
     * @param  array<int, User>  $clients
     * @param  array<int, User>  $professionals
     * @param  array<string, ServiceRequest>  $serviceRequests
     * @param  array<string, Contract>  $contracts
     */
    private function createReports(array $clients, array $professionals, array $serviceRequests, array $contracts, User $admin): void
    {
        Report::updateOrCreate(
            [
                'reporter_id' => $clients[0]->id,
                'report_type' => ReportType::User->value,
                'reason' => ReportReason::FakeProfile->value,
            ],
            [
                'reported_user_id' => $professionals[7]->id,
                'service_request_id' => null,
                'contract_id' => null,
                'description' => 'O perfil parece conter informação incoerente sobre experiência e localização.',
                'status' => ReportStatus::Pending->value,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'resolution_note' => null,
            ],
        );

        Report::updateOrCreate(
            [
                'reporter_id' => $clients[2]->id,
                'report_type' => ReportType::ServiceRequest->value,
                'reason' => ReportReason::Spam->value,
            ],
            [
                'reported_user_id' => null,
                'service_request_id' => $serviceRequests['logo_design']->id,
                'contract_id' => null,
                'description' => 'O pedido parece repetido e sem detalhe suficiente.',
                'status' => ReportStatus::Reviewing->value,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now()->subHours(6),
                'resolution_note' => null,
            ],
        );

        Report::updateOrCreate(
            [
                'reporter_id' => $clients[4]->id,
                'report_type' => ReportType::Contract->value,
                'reason' => ReportReason::ServiceNotDelivered->value,
            ],
            [
                'reported_user_id' => $professionals[2]->id,
                'service_request_id' => null,
                'contract_id' => $contracts['disputed_canalizacao']->id,
                'description' => 'O serviço atrasou mais do que o combinado.',
                'status' => ReportStatus::Resolved->value,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now()->subHours(3),
                'resolution_note' => 'Orientação enviada às partes com pedido de resposta em 24 horas.',
            ],
        );
    }

    private function createDispute(Contract $contract, User $client, User $professional, User $admin): void
    {
        $dispute = Dispute::updateOrCreate(
            ['contract_id' => $contract->id],
            [
                'opened_by' => $client->id,
                'assigned_to' => $admin->id,
                'reason' => 'service_not_delivered',
                'description' => 'O serviço foi iniciado tarde e faltou concluir os detalhes combinados.',
                'status' => DisputeStatus::UnderReview->value,
                'resolution' => null,
                'resolution_note' => null,
                'resolved_at' => null,
            ],
        );

        DisputeMessage::updateOrCreate(
            [
                'dispute_id' => $dispute->id,
                'sender_id' => $client->id,
                'message' => 'Preciso de uma resposta clara sobre o prazo final.',
            ],
            [
                'message' => 'Preciso de uma resposta clara sobre o prazo final.',
            ],
        );

        DisputeMessage::updateOrCreate(
            [
                'dispute_id' => $dispute->id,
                'sender_id' => $professional->id,
                'message' => 'Vou concluir hoje e enviar a evidência.',
            ],
            [
                'message' => 'Vou concluir hoje e enviar a evidência.',
            ],
        );

        $relativePath = "demo/disputes/{$dispute->id}/evidence-1.jpg";
        $contents = 'Demo dispute evidence.';
        $this->storeDemoFile($relativePath, $contents);

        DisputeEvidence::updateOrCreate(
            [
                'dispute_id' => $dispute->id,
                'file_path' => $relativePath,
            ],
            [
                'uploaded_by' => $professional->id,
                'file_name' => 'evidence-1.jpg',
                'file_type' => 'image/jpeg',
                'file_size' => strlen($contents),
                'description' => 'Foto de apoio da intervenção.',
            ],
        );
    }

    /**
     * @param  array<string, ServiceRequest>  $serviceRequests
     * @param  array<int, ProfessionalProfile>  $profiles
     * @param  array<int, User>  $clients
     */
    private function createInvitations(array $serviceRequests, array $profiles, array $clients): void
    {
        $invitations = [
            [
                'service_request_key' => 'house_transport',
                'professional_index' => 5,
                'client_index' => 4,
                'message' => 'Tem interesse neste transporte entre Matola e Maputo?',
            ],
            [
                'service_request_key' => 'apartment_cleaning',
                'professional_index' => 3,
                'client_index' => 4,
                'message' => 'Preciso de apoio para limpeza pós-obra com urgência.',
            ],
            [
                'service_request_key' => 'warehouse_electrical',
                'professional_index' => 1,
                'client_index' => 4,
                'message' => 'Pode enviar uma proposta para a revisão elétrica?',
            ],
        ];

        foreach ($invitations as $invitation) {
            ProfessionalInvitation::updateOrCreate(
                [
                    'service_request_id' => $serviceRequests[$invitation['service_request_key']]->id,
                    'professional_profile_id' => $profiles[$invitation['professional_index']]->id,
                ],
                [
                    'client_id' => $clients[$invitation['client_index']]->id,
                    'message' => $invitation['message'],
                    'status' => InvitationStatus::Pending->value,
                    'declined_at' => null,
                ],
            );
        }
    }

    /**
     * @return array<string, int>
     */
    private function loadReferences(): array
    {
        return [
            'categories' => Category::query()->pluck('id', 'name')->all(),
            'skills' => Skill::query()->pluck('id', 'name')->all(),
        ];
    }

    /**
     * @param  array<int, string>  $categoryNames
     * @param  array<string, int>  $references
     * @return array<int, int>
     */
    private function categoryIdsFor(array $categoryNames, array $references): array
    {
        return collect($categoryNames)
            ->map(fn (string $name): ?int => $references['categories'][$name] ?? null)
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $categoryNames
     * @param  array<string, int>  $references
     * @return array<int, int>
     */
    private function skillIdsForCategories(array $categoryNames, array $references): array
    {
        $categoryIds = $this->categoryIdsFor($categoryNames, $references);

        return Skill::query()
            ->whereIn('category_id', $categoryIds)
            ->orderBy('name')
            ->take(4)
            ->pluck('id')
            ->all();
    }

    private function storeDemoFile(string $relativePath, string $contents): void
    {
        Storage::disk('local')->put($relativePath, $contents);
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function storeConversationMessages(Conversation $conversation, array $messages): void
    {
        foreach ($messages as $index => $messageData) {
            \App\Models\Message::updateOrCreate(
                [
                    'conversation_id' => $conversation->id,
                    'sender_id' => $messageData['sender_id'],
                    'message' => $messageData['message'],
                ],
                [
                    'message_type' => MessageType::Text->value,
                    'read_at' => $index === 0 ? now()->subHours(2) : null,
                ],
            );
        }
    }

    private function storeDisputeEvidence(Contract $contract, User $admin): void
    {
        $dispute = Dispute::query()->where('contract_id', $contract->id)->first();

        if (! $dispute) {
            return;
        }

        $relativePath = "demo/disputes/{$dispute->id}/supporting-photo.jpg";
        $contents = "Demo evidence for dispute {$dispute->id}.";
        $this->storeDemoFile($relativePath, $contents);

        DisputeEvidence::updateOrCreate(
            [
                'dispute_id' => $dispute->id,
                'file_path' => $relativePath,
            ],
            [
                'uploaded_by' => $admin->id,
                'file_name' => 'supporting-photo.jpg',
                'file_type' => 'image/jpeg',
                'file_size' => strlen($contents),
                'description' => 'Documento de suporte para a análise da disputa.',
            ],
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function clientDefinitions(): array
    {
        return [
            [
                'name' => 'Adriano Mucavele',
                'email' => 'client1@demo.tempoconect.local',
                'phone' => '+258840100001',
                'province' => 'Maputo Cidade',
                'city' => 'KaMpfumo',
                'address' => 'Av. 24 de Julho, Maputo',
            ],
            [
                'name' => 'Beatriz Nhaca',
                'email' => 'client2@demo.tempoconect.local',
                'phone' => '+258840100002',
                'province' => 'Maputo Província',
                'city' => 'Matola',
                'address' => 'Bairro Tchumene, Matola',
            ],
            [
                'name' => 'Carlos Chissano',
                'email' => 'client3@demo.tempoconect.local',
                'phone' => '+258840100003',
                'province' => 'Sofala',
                'city' => 'Beira',
                'address' => 'Bairro Manga, Beira',
            ],
            [
                'name' => 'Dina Machel',
                'email' => 'client4@demo.tempoconect.local',
                'phone' => '+258840100004',
                'province' => 'Nampula',
                'city' => 'Nampula',
                'address' => 'Bairro Namicopo, Nampula',
            ],
            [
                'name' => 'Ernesto Pelembe',
                'email' => 'client5@demo.tempoconect.local',
                'phone' => '+258840100005',
                'province' => 'Gaza',
                'city' => 'Xai-Xai',
                'address' => 'Bairro Central, Xai-Xai',
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function professionalDefinitions(): array
    {
        return [
            [
                'name' => 'Afonso Nhapulo',
                'email' => 'professional1@demo.tempoconect.local',
                'phone' => '+258850100001',
                'province' => 'Maputo Cidade',
                'city' => 'KaMpfumo',
                'address' => 'Bairro Polana Cimento, Maputo',
                'profile_address' => 'Rua da Resistência, Maputo',
                'headline' => 'Técnico de redes e suporte remoto',
                'bio' => 'Resolve problemas de internet, computadores e pequenas redes para residências e empresas.',
                'experience_years' => 7,
                'base_price' => 2500,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Approved,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -25.9692,
                'longitude' => 32.5732,
                'categories' => ['Informática'],
                'skill_categories' => ['Informática'],
                'portfolio_count' => 2,
                'documents' => [
                    [
                        'document_type' => 'nuit',
                        'file_name' => 'nuit-afonso.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-afonso.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                ],
            ],
            [
                'name' => 'Benilde Machel',
                'email' => 'professional2@demo.tempoconect.local',
                'phone' => '+258850100002',
                'province' => 'Maputo Província',
                'city' => 'Matola',
                'address' => 'Bairro da Machava, Matola',
                'profile_address' => 'Avenida Samora Machel, Matola',
                'headline' => 'Electricista para residências e lojas',
                'bio' => 'Executa instalações, manutenção e pequenas reparações eléctricas com foco em segurança.',
                'experience_years' => 9,
                'base_price' => 3000,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Approved,
                'availability' => AvailabilityStatus::Busy,
                'latitude' => -25.9692,
                'longitude' => 32.4638,
                'categories' => ['Electricidade'],
                'skill_categories' => ['Electricidade'],
                'portfolio_count' => 2,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-benilde.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                ],
            ],
            [
                'name' => 'Celso Mondlane',
                'email' => 'professional3@demo.tempoconect.local',
                'phone' => '+258850100003',
                'province' => 'Sofala',
                'city' => 'Beira',
                'address' => 'Bairro Ponta-Gêa, Beira',
                'profile_address' => 'Avenida Marginal, Beira',
                'headline' => 'Canalizador para reparações urgentes',
                'bio' => 'Trabalha com fugas de água, desentupimentos e instalação de sanitários.',
                'experience_years' => 6,
                'base_price' => 2200,
                'price_type' => 'hourly',
                'verification_status' => VerificationStatus::Pending,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -19.8436,
                'longitude' => 34.8387,
                'categories' => ['Canalização'],
                'skill_categories' => ['Canalização'],
                'portfolio_count' => 1,
                'documents' => [
                    [
                        'document_type' => 'nuit',
                        'file_name' => 'nuit-celso.pdf',
                        'status' => VerificationStatus::Pending,
                    ],
                ],
            ],
            [
                'name' => 'Daniela Uamusse',
                'email' => 'professional4@demo.tempoconect.local',
                'phone' => '+258850100004',
                'province' => 'Nampula',
                'city' => 'Nampula',
                'address' => 'Bairro Muatala, Nampula',
                'profile_address' => 'Rua de Nampula, Nampula',
                'headline' => 'Equipa de limpeza para casas e escritórios',
                'bio' => 'Limpeza profunda, pós-obra e manutenção semanal com material próprio.',
                'experience_years' => 4,
                'base_price' => 1800,
                'price_type' => 'negotiable',
                'verification_status' => VerificationStatus::Approved,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -15.1165,
                'longitude' => 39.2666,
                'categories' => ['Limpeza'],
                'skill_categories' => ['Limpeza'],
                'portfolio_count' => 2,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-daniela.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                ],
            ],
            [
                'name' => 'Edson Vumba',
                'email' => 'professional5@demo.tempoconect.local',
                'phone' => '+258850100005',
                'province' => 'Manica',
                'city' => 'Chimoio',
                'address' => 'Bairro 2, Chimoio',
                'profile_address' => 'Avenida 25 de Setembro, Chimoio',
                'headline' => 'Designer gráfico para marcas e eventos',
                'bio' => 'Criação de identidades visuais, cartazes e materiais para redes sociais.',
                'experience_years' => 8,
                'base_price' => 3500,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Rejected,
                'availability' => AvailabilityStatus::Away,
                'latitude' => -19.1164,
                'longitude' => 33.4833,
                'categories' => ['Design'],
                'skill_categories' => ['Design'],
                'portfolio_count' => 3,
                'documents' => [
                    [
                        'document_type' => 'nuit',
                        'file_name' => 'nuit-edson.pdf',
                        'status' => VerificationStatus::Rejected,
                        'rejection_reason' => 'Documento ilegível na imagem enviada.',
                    ],
                ],
            ],
            [
                'name' => 'Fátima Macuacua',
                'email' => 'professional6@demo.tempoconect.local',
                'phone' => '+258850100006',
                'province' => 'Gaza',
                'city' => 'Xai-Xai',
                'address' => 'Bairro 25 de Junho, Xai-Xai',
                'profile_address' => 'Rua da Praia, Xai-Xai',
                'headline' => 'Transportes locais e mudanças pequenas',
                'bio' => 'Faz transporte de mercadorias, mobiliário e pequenas mudanças entre distritos.',
                'experience_years' => 5,
                'base_price' => 2800,
                'price_type' => 'hourly',
                'verification_status' => VerificationStatus::Pending,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -25.0519,
                'longitude' => 33.6442,
                'categories' => ['Transporte'],
                'skill_categories' => ['Transporte'],
                'portfolio_count' => 1,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-fatima.pdf',
                        'status' => VerificationStatus::Pending,
                    ],
                ],
            ],
            [
                'name' => 'Gilberto Amade',
                'email' => 'professional7@demo.tempoconect.local',
                'phone' => '+258850100007',
                'province' => 'Tete',
                'city' => 'Tete',
                'address' => 'Bairro Matundo, Tete',
                'profile_address' => 'Avenida da Liberdade, Tete',
                'headline' => 'Suporte de informática para PME',
                'bio' => 'Configuração de computadores, backups e manutenção de impressoras.',
                'experience_years' => 10,
                'base_price' => 3200,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Approved,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -16.1564,
                'longitude' => 33.5867,
                'categories' => ['Informática'],
                'skill_categories' => ['Informática'],
                'portfolio_count' => 2,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-gilberto.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                    [
                        'document_type' => 'nuit',
                        'file_name' => 'nuit-gilberto.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                ],
            ],
            [
                'name' => 'Helena Massinga',
                'email' => 'professional8@demo.tempoconect.local',
                'phone' => '+258850100008',
                'province' => 'Inhambane',
                'city' => 'Inhambane',
                'address' => 'Bairro Balane, Inhambane',
                'profile_address' => 'Rua 1 de Maio, Inhambane',
                'headline' => 'Electricista para manutenção preventiva',
                'bio' => 'Realiza vistoria eléctrica, substituição de tomadas e instalação de chuveiros.',
                'experience_years' => 12,
                'base_price' => 2600,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Rejected,
                'availability' => AvailabilityStatus::Unavailable,
                'latitude' => -23.8652,
                'longitude' => 35.3833,
                'categories' => ['Electricidade'],
                'skill_categories' => ['Electricidade'],
                'portfolio_count' => 1,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-helena.pdf',
                        'status' => VerificationStatus::Rejected,
                        'rejection_reason' => 'Documento expirado.',
                    ],
                ],
            ],
            [
                'name' => 'Isaque Mário',
                'email' => 'professional9@demo.tempoconect.local',
                'phone' => '+258850100009',
                'province' => 'Zambézia',
                'city' => 'Quelimane',
                'address' => 'Bairro Torrone Novo, Quelimane',
                'profile_address' => 'Avenida dos Heróis, Quelimane',
                'headline' => 'Canalizador para obras residenciais',
                'bio' => 'Executa obras de canalização, reparações e intervenções de emergência.',
                'experience_years' => 7,
                'base_price' => 2400,
                'price_type' => 'negotiable',
                'verification_status' => VerificationStatus::Pending,
                'availability' => AvailabilityStatus::Busy,
                'latitude' => -17.8786,
                'longitude' => 36.8883,
                'categories' => ['Canalização'],
                'skill_categories' => ['Canalização'],
                'portfolio_count' => 1,
                'documents' => [
                    [
                        'document_type' => 'nuit',
                        'file_name' => 'nuit-isaque.pdf',
                        'status' => VerificationStatus::Pending,
                    ],
                ],
            ],
            [
                'name' => 'Joana Nhaca',
                'email' => 'professional10@demo.tempoconect.local',
                'phone' => '+258850100010',
                'province' => 'Niassa',
                'city' => 'Lichinga',
                'address' => 'Bairro Namacula, Lichinga',
                'profile_address' => 'Avenida 24 de Setembro, Lichinga',
                'headline' => 'Design e produção de material promocional',
                'bio' => 'Cria artes digitais e apoio de limpeza pós-evento para pequenas equipas.',
                'experience_years' => 3,
                'base_price' => 1500,
                'price_type' => 'fixed',
                'verification_status' => VerificationStatus::Approved,
                'availability' => AvailabilityStatus::Available,
                'latitude' => -13.3088,
                'longitude' => 35.2406,
                'categories' => ['Design', 'Limpeza'],
                'skill_categories' => ['Design', 'Limpeza'],
                'portfolio_count' => 2,
                'documents' => [
                    [
                        'document_type' => 'bi',
                        'file_name' => 'bi-joana.pdf',
                        'status' => VerificationStatus::Approved,
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function serviceRequestDefinitions(): array
    {
        return [
            [
                'key' => 'wifi_home',
                'client_index' => 0,
                'category' => 'Informática',
                'title' => 'Configuração de Wi-Fi doméstico',
                'description' => 'Preciso de instalar e optimizar o Wi-Fi num apartamento T2 em Maputo.',
                'service_type' => 'local',
                'budget_min' => 1200,
                'budget_max' => 2500,
                'budget_type' => 'fixed',
                'province' => 'Maputo Cidade',
                'city' => 'KaMpfumo',
                'address' => 'Av. 24 de Julho, Maputo',
                'latitude' => -25.9650,
                'longitude' => 32.5890,
                'deadline_at' => now()->addDays(7),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [
                    [
                        'file_name' => 'wifi-room-photo.jpg',
                        'file_type' => 'image/jpeg',
                    ],
                ],
            ],
            [
                'key' => 'office_power',
                'client_index' => 1,
                'category' => 'Electricidade',
                'title' => 'Instalação de tomadas no escritório',
                'description' => 'É necessário instalar tomadas adicionais e rever o quadro eléctrico.',
                'service_type' => 'local',
                'budget_min' => 2000,
                'budget_max' => 4000,
                'budget_type' => 'negotiable',
                'province' => 'Maputo Província',
                'city' => 'Matola',
                'address' => 'Bairro T3, Matola',
                'latitude' => -25.9620,
                'longitude' => 32.4580,
                'deadline_at' => now()->addDays(5),
                'status' => ServiceRequestStatus::ReceivingProposals,
                'attachments' => [],
            ],
            [
                'key' => 'apartment_cleaning',
                'client_index' => 2,
                'category' => 'Limpeza',
                'title' => 'Limpeza profunda de apartamento T3',
                'description' => 'Preciso de limpeza completa antes da entrega do imóvel.',
                'service_type' => 'local',
                'budget_min' => 1500,
                'budget_max' => 2800,
                'budget_type' => 'fixed',
                'province' => 'Sofala',
                'city' => 'Beira',
                'address' => 'Bairro Macuti, Beira',
                'latitude' => -19.8440,
                'longitude' => 34.8330,
                'deadline_at' => now()->addDays(9),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [],
            ],
            [
                'key' => 'logo_design',
                'client_index' => 3,
                'category' => 'Design',
                'title' => 'Criação de logotipo para salão',
                'description' => 'Quero uma identidade simples e elegante para o negócio.',
                'service_type' => 'remote',
                'budget_min' => 1000,
                'budget_max' => 3500,
                'budget_type' => 'negotiable',
                'province' => 'Nampula',
                'city' => 'Nampula',
                'address' => 'Centro da cidade, Nampula',
                'latitude' => -15.1160,
                'longitude' => 39.2660,
                'deadline_at' => now()->addDays(4),
                'status' => ServiceRequestStatus::ReceivingProposals,
                'attachments' => [
                    [
                        'file_name' => 'brand-brief.pdf',
                        'file_type' => 'application/pdf',
                    ],
                ],
            ],
            [
                'key' => 'house_transport',
                'client_index' => 4,
                'category' => 'Transporte',
                'title' => 'Transporte de móveis para Matola',
                'description' => 'Mudança pequena com alguns móveis e caixas de cozinha.',
                'service_type' => 'local',
                'budget_min' => 1800,
                'budget_max' => 4200,
                'budget_type' => 'hourly',
                'province' => 'Gaza',
                'city' => 'Xai-Xai',
                'address' => 'Bairro 7 de Abril, Xai-Xai',
                'latitude' => -25.0510,
                'longitude' => 33.6440,
                'deadline_at' => now()->addDays(11),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [],
            ],
            [
                'key' => 'wi_fi_active',
                'client_index' => 0,
                'category' => 'Informática',
                'title' => 'Instalação de rede Wi-Fi em escritório',
                'description' => 'Escritório pequeno com necessidade de cobertura estável.',
                'service_type' => 'local',
                'budget_min' => 2500,
                'budget_max' => 4500,
                'budget_type' => 'fixed',
                'province' => 'Maputo Cidade',
                'city' => 'KaMpfumo',
                'address' => 'Av. Julius Nyerere, Maputo',
                'latitude' => -25.9670,
                'longitude' => 32.5900,
                'deadline_at' => now()->addDays(3),
                'status' => ServiceRequestStatus::InProgress,
                'attachments' => [
                    [
                        'file_name' => 'office-floor-plan.pdf',
                        'file_type' => 'application/pdf',
                    ],
                ],
            ],
            [
                'key' => 'maintenance_company',
                'client_index' => 1,
                'category' => 'Informática',
                'title' => 'Manutenção de redes para pequena empresa',
                'description' => 'Backups, impressoras e manutenção mensal de computadores.',
                'service_type' => 'remote',
                'budget_min' => 4500,
                'budget_max' => 7000,
                'budget_type' => 'fixed',
                'province' => 'Maputo Província',
                'city' => 'Matola',
                'address' => 'Zona Industrial, Matola',
                'latitude' => -25.9530,
                'longitude' => 32.4670,
                'deadline_at' => now()->subDays(5),
                'status' => ServiceRequestStatus::Completed,
                'attachments' => [],
            ],
            [
                'key' => 'community_poster',
                'client_index' => 2,
                'category' => 'Design',
                'title' => 'Cartaz para evento comunitário',
                'description' => 'Cartaz simples para evento local com data, local e patrocinadores.',
                'service_type' => 'remote',
                'budget_min' => 1200,
                'budget_max' => 3000,
                'budget_type' => 'fixed',
                'province' => 'Sofala',
                'city' => 'Beira',
                'address' => 'Bairro Chipangara, Beira',
                'latitude' => -19.8350,
                'longitude' => 34.8440,
                'deadline_at' => now()->subDays(4),
                'status' => ServiceRequestStatus::Completed,
                'attachments' => [
                    [
                        'file_name' => 'event-brief.pdf',
                        'file_type' => 'application/pdf',
                    ],
                ],
            ],
            [
                'key' => 'blocked_pipe',
                'client_index' => 3,
                'category' => 'Canalização',
                'title' => 'Desentupimento de pia de cozinha',
                'description' => 'Canalização com cheiro forte e escoamento lento.',
                'service_type' => 'local',
                'budget_min' => 1000,
                'budget_max' => 2400,
                'budget_type' => 'negotiable',
                'province' => 'Nampula',
                'city' => 'Nampula',
                'address' => 'Bairro Namutequeliua, Nampula',
                'latitude' => -15.1190,
                'longitude' => 39.2800,
                'deadline_at' => now()->subDays(2),
                'status' => ServiceRequestStatus::InProgress,
                'attachments' => [],
            ],
            [
                'key' => 'post_build_cleaning',
                'client_index' => 4,
                'category' => 'Limpeza',
                'title' => 'Limpeza pós-obra em loja',
                'description' => 'Remoção de pó, tinta e resíduos de uma pequena loja.',
                'service_type' => 'local',
                'budget_min' => 2000,
                'budget_max' => 3600,
                'budget_type' => 'fixed',
                'province' => 'Gaza',
                'city' => 'Xai-Xai',
                'address' => 'Bairro 25 de Setembro, Xai-Xai',
                'latitude' => -25.0500,
                'longitude' => 33.6450,
                'deadline_at' => now()->subDays(1),
                'status' => ServiceRequestStatus::Cancelled,
                'attachments' => [],
            ],
            [
                'key' => 'shower_install',
                'client_index' => 0,
                'category' => 'Electricidade',
                'title' => 'Instalação de chuveiro elétrico',
                'description' => 'Substituição e ligação segura de chuveiro elétrico.',
                'service_type' => 'local',
                'budget_min' => 1400,
                'budget_max' => 2800,
                'budget_type' => 'fixed',
                'province' => 'Maputo Cidade',
                'city' => 'KaMpfumo',
                'address' => 'Bairro Sommerschield, Maputo',
                'latitude' => -25.9600,
                'longitude' => 32.5905,
                'deadline_at' => now()->addDays(6),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [],
            ],
            [
                'key' => 'moving_boxes',
                'client_index' => 1,
                'category' => 'Transporte',
                'title' => 'Mudança de caixas e mobília pequena',
                'description' => 'Transporte de caixas, cadeiras e secretária entre bairros.',
                'service_type' => 'local',
                'budget_min' => 1800,
                'budget_max' => 3200,
                'budget_type' => 'hourly',
                'province' => 'Maputo Província',
                'city' => 'Matola',
                'address' => 'Bairro Ndlavela, Matola',
                'latitude' => -25.9605,
                'longitude' => 32.4695,
                'deadline_at' => now()->addDays(8),
                'status' => ServiceRequestStatus::ReceivingProposals,
                'attachments' => [],
            ],
            [
                'key' => 'printer_config',
                'client_index' => 2,
                'category' => 'Informática',
                'title' => 'Configuração de impressora em escritório',
                'description' => 'Ligação de impressora partilhada em rede local.',
                'service_type' => 'remote',
                'budget_min' => 900,
                'budget_max' => 1800,
                'budget_type' => 'fixed',
                'province' => 'Sofala',
                'city' => 'Beira',
                'address' => 'Bairro Matadouro, Beira',
                'latitude' => -19.8600,
                'longitude' => 34.8400,
                'deadline_at' => now()->addDays(10),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [],
            ],
            [
                'key' => 'restaurant_identity',
                'client_index' => 3,
                'category' => 'Design',
                'title' => 'Identidade visual para restaurante',
                'description' => 'Logo, paleta de cores e materiais base para redes sociais.',
                'service_type' => 'remote',
                'budget_min' => 2500,
                'budget_max' => 5000,
                'budget_type' => 'fixed',
                'province' => 'Nampula',
                'city' => 'Nampula',
                'address' => 'Centro da cidade, Nampula',
                'latitude' => -15.1170,
                'longitude' => 39.2650,
                'deadline_at' => now()->subDays(7),
                'status' => ServiceRequestStatus::Cancelled,
                'attachments' => [],
            ],
            [
                'key' => 'warehouse_electrical',
                'client_index' => 4,
                'category' => 'Electricidade',
                'title' => 'Revisão eléctrica de armazém',
                'description' => 'Inspeção eléctrica preventiva num pequeno armazém.',
                'service_type' => 'local',
                'budget_min' => 3000,
                'budget_max' => 6000,
                'budget_type' => 'negotiable',
                'province' => 'Gaza',
                'city' => 'Xai-Xai',
                'address' => 'Zona Industrial, Xai-Xai',
                'latitude' => -25.0495,
                'longitude' => 33.6460,
                'deadline_at' => now()->addDays(12),
                'status' => ServiceRequestStatus::Published,
                'attachments' => [],
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function proposalDefinitions(): array
    {
        return [
            [
                'key' => 'wifi_afonso',
                'service_request_key' => 'wifi_home',
                'professional_index' => 0,
                'amount' => 2200,
                'delivery_days' => 2,
                'message' => 'Faço a instalação e deixo a rede optimizada no mesmo dia.',
                'status' => ProposalStatus::Accepted,
            ],
            [
                'key' => 'wifi_gilberto',
                'service_request_key' => 'wifi_home',
                'professional_index' => 6,
                'amount' => 2400,
                'delivery_days' => 3,
                'message' => 'Incluo diagnóstico do router e cobertura do sinal.',
                'status' => ProposalStatus::Rejected,
            ],
            [
                'key' => 'power_benilde',
                'service_request_key' => 'office_power',
                'professional_index' => 1,
                'amount' => 3200,
                'delivery_days' => 4,
                'message' => 'Posso rever o quadro e instalar as novas tomadas.',
                'status' => ProposalStatus::Pending,
            ],
            [
                'key' => 'cleaning_daniela',
                'service_request_key' => 'apartment_cleaning',
                'professional_index' => 3,
                'amount' => 2100,
                'delivery_days' => 1,
                'message' => 'Equipa pronta para limpeza profunda com produtos incluídos.',
                'status' => ProposalStatus::Pending,
            ],
            [
                'key' => 'design_edson',
                'service_request_key' => 'logo_design',
                'professional_index' => 4,
                'amount' => 1800,
                'delivery_days' => 3,
                'message' => 'Entrego três propostas iniciais de identidade visual.',
                'status' => ProposalStatus::Pending,
            ],
            [
                'key' => 'transport_fatima',
                'service_request_key' => 'house_transport',
                'professional_index' => 5,
                'amount' => 2400,
                'delivery_days' => 1,
                'message' => 'Tenho carrinha disponível para a mudança no dia pedido.',
                'status' => ProposalStatus::Pending,
            ],
            [
                'key' => 'active_celso',
                'service_request_key' => 'wi_fi_active',
                'professional_index' => 2,
                'amount' => 3300,
                'delivery_days' => 2,
                'message' => 'Instalação segura com testes finais de estabilidade.',
                'status' => ProposalStatus::Accepted,
            ],
            [
                'key' => 'active_gilberto',
                'service_request_key' => 'wi_fi_active',
                'professional_index' => 6,
                'amount' => 3600,
                'delivery_days' => 2,
                'message' => 'Posso apoiar com testes de rede e manutenção futura.',
                'status' => ProposalStatus::Rejected,
            ],
            [
                'key' => 'completed_benilde',
                'service_request_key' => 'maintenance_company',
                'professional_index' => 1,
                'amount' => 5200,
                'delivery_days' => 5,
                'message' => 'Contrato mensal com suporte e manutenção programada.',
                'status' => ProposalStatus::Accepted,
            ],
            [
                'key' => 'completed_joana',
                'service_request_key' => 'maintenance_company',
                'professional_index' => 9,
                'amount' => 5000,
                'delivery_days' => 6,
                'message' => 'Inclui design de suporte para materiais internos.',
                'status' => ProposalStatus::Rejected,
            ],
            [
                'key' => 'poster_edson',
                'service_request_key' => 'community_poster',
                'professional_index' => 4,
                'amount' => 1500,
                'delivery_days' => 2,
                'message' => 'Criação rápida com opções para impressão e digital.',
                'status' => ProposalStatus::Accepted,
            ],
            [
                'key' => 'poster_joana',
                'service_request_key' => 'community_poster',
                'professional_index' => 9,
                'amount' => 1600,
                'delivery_days' => 2,
                'message' => 'Posso ajustar cores e formatos para redes sociais.',
                'status' => ProposalStatus::Rejected,
            ],
            [
                'key' => 'pipe_celso',
                'service_request_key' => 'blocked_pipe',
                'professional_index' => 2,
                'amount' => 1900,
                'delivery_days' => 1,
                'message' => 'Intervenção rápida com troca de peças se necessário.',
                'status' => ProposalStatus::Accepted,
            ],
            [
                'key' => 'pipe_isaque',
                'service_request_key' => 'blocked_pipe',
                'professional_index' => 8,
                'amount' => 2000,
                'delivery_days' => 2,
                'message' => 'Posso fazer o diagnóstico e deixar tudo funcional.',
                'status' => ProposalStatus::Rejected,
            ],
            [
                'key' => 'cleaning_post_build',
                'service_request_key' => 'post_build_cleaning',
                'professional_index' => 3,
                'amount' => 3000,
                'delivery_days' => 2,
                'message' => 'Limpeza com equipa reforçada para pós-obra.',
                'status' => ProposalStatus::Pending,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function contractDefinitions(): array
    {
        return [
            [
                'key' => 'completed_maputo',
                'service_request_key' => 'maintenance_company',
                'proposal_key' => 'completed_benilde',
                'client_index' => 1,
                'professional_index' => 1,
                'amount' => 5200,
                'status' => ContractStatus::Completed,
                'service_request_status' => ServiceRequestStatus::Completed,
                'started_at' => now()->subDays(7),
                'completed_at' => now()->subDays(2),
                'cancelled_at' => null,
                'accepted_at' => now()->subDays(8),
                'log_statuses' => ['active', 'completed'],
                'log_notes' => ['Contrato criado a partir da proposta aceite.', 'Contrato concluído pelo cliente.'],
            ],
            [
                'key' => 'active_wi_fi',
                'service_request_key' => 'wi_fi_active',
                'proposal_key' => 'active_celso',
                'client_index' => 0,
                'professional_index' => 2,
                'amount' => 3300,
                'status' => ContractStatus::Active,
                'service_request_status' => ServiceRequestStatus::InProgress,
                'started_at' => now()->subDays(1),
                'completed_at' => null,
                'cancelled_at' => null,
                'accepted_at' => now()->subDays(1),
                'log_statuses' => ['active'],
                'log_notes' => ['Contrato criado a partir da proposta aceite.'],
            ],
            [
                'key' => 'disputed_canalizacao',
                'service_request_key' => 'blocked_pipe',
                'proposal_key' => 'pipe_celso',
                'client_index' => 3,
                'professional_index' => 2,
                'amount' => 1900,
                'status' => ContractStatus::Disputed,
                'service_request_status' => ServiceRequestStatus::InProgress,
                'started_at' => now()->subDays(4),
                'completed_at' => null,
                'cancelled_at' => null,
                'accepted_at' => now()->subDays(5),
                'log_statuses' => ['active', 'disputed'],
                'log_notes' => ['Contrato criado a partir da proposta aceite.', 'Contrato colocado em disputa.'],
            ],
            [
                'key' => 'completed_design',
                'service_request_key' => 'community_poster',
                'proposal_key' => 'poster_edson',
                'client_index' => 2,
                'professional_index' => 4,
                'amount' => 1500,
                'status' => ContractStatus::Completed,
                'service_request_status' => ServiceRequestStatus::Completed,
                'started_at' => now()->subDays(6),
                'completed_at' => now()->subDays(1),
                'cancelled_at' => null,
                'accepted_at' => now()->subDays(7),
                'log_statuses' => ['active', 'completed'],
                'log_notes' => ['Contrato criado a partir da proposta aceite.', 'Contrato concluído pelo cliente.'],
            ],
        ];
    }
}
