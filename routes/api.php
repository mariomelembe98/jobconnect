<?php

use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\DisputeController as AdminDisputeController;
use App\Http\Controllers\Api\V1\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\V1\Admin\SkillController as AdminSkillController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Admin\VerificationController as AdminVerificationController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Client\ServiceRequestController as ClientServiceRequestController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\DisputeController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\Lookup\CategoryController;
use App\Http\Controllers\Api\V1\Lookup\LocationController;
use App\Http\Controllers\Api\V1\Lookup\SkillController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\Professional\DashboardController as ProfessionalDashboardController;
use App\Http\Controllers\Api\V1\Professional\DocumentController;
use App\Http\Controllers\Api\V1\Professional\PortfolioController;
use App\Http\Controllers\Api\V1\Professional\ProfileController as ProfessionalProfileController;
use App\Http\Controllers\Api\V1\ProfessionalDirectoryController;
use App\Http\Controllers\Api\V1\ProfessionalInvitationController;
use App\Http\Controllers\Api\V1\ProposalController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\ServiceRequestController;
use App\Http\Controllers\Api\V1\UserProfileController;
use App\Http\Middleware\EnsureAuthenticatedUserIsActive;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('skills', [SkillController::class, 'index']);
    Route::get('professionals', [ProfessionalDirectoryController::class, 'index']);
    Route::get('professionals/{professionalProfile}', [ProfessionalDirectoryController::class, 'show'])
        ->missing(fn () => ProfessionalDirectoryController::missingResponse());
    Route::get('professionals/{professionalProfile}/reviews', [ProfessionalDirectoryController::class, 'reviews'])
        ->missing(fn () => ProfessionalDirectoryController::missingResponse());

    Route::prefix('locations')->group(function (): void {
        Route::get('provinces', [LocationController::class, 'provinces']);
        Route::get('cities', [LocationController::class, 'cities']);
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware(['auth:sanctum', EnsureAuthenticatedUserIsActive::class])->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware(['auth:sanctum', EnsureAuthenticatedUserIsActive::class])->prefix('users/me')->group(function (): void {
        Route::get('/', [UserProfileController::class, 'show']);
        Route::patch('/', [UserProfileController::class, 'update']);
        Route::patch('location', [UserProfileController::class, 'updateLocation']);
        Route::patch('password', [UserProfileController::class, 'changePassword']);
    });

    Route::get('service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']);

    Route::middleware(['auth:sanctum', EnsureAuthenticatedUserIsActive::class])->group(function (): void {
        Route::get('service-requests', [ServiceRequestController::class, 'index']);
        Route::post('service-requests', [ServiceRequestController::class, 'store']);
        Route::patch('service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']);
        Route::post('service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
        Route::post('service-requests/{serviceRequest}/attachments', [ServiceRequestController::class, 'storeAttachments']);
        Route::delete('service-requests/{serviceRequest}/attachments/{attachment}', [ServiceRequestController::class, 'destroyAttachment']);
        Route::post('service-requests/{serviceRequest}/invite', [ServiceRequestController::class, 'invite']);
        Route::get('client/service-requests', [ClientServiceRequestController::class, 'index']);
        Route::post('proposals', [ProposalController::class, 'store']);
        Route::get('proposals/{proposal}', [ProposalController::class, 'show']);
        Route::post('proposals/{proposal}/withdraw', [ProposalController::class, 'withdraw']);
        Route::post('proposals/{proposal}/accept', [ProposalController::class, 'accept']);
        Route::post('proposals/{proposal}/reject', [ProposalController::class, 'reject']);
        Route::get('professional/proposals', [ProposalController::class, 'professionalIndex']);
        Route::get('service-requests/{serviceRequest}/proposals', [ProposalController::class, 'serviceRequestIndex']);
        Route::get('conversations', [ConversationController::class, 'index']);
        Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
        Route::post('conversations/{conversation}/archive', [ConversationController::class, 'archive']);
        Route::get('conversations/{conversation}/messages', [ConversationController::class, 'messages']);
        Route::post('conversations/{conversation}/messages', [ConversationController::class, 'storeMessage']);
        Route::post('conversations/{conversation}/read', [ConversationController::class, 'read']);
        Route::post('messages/{message}/attachments', [MessageController::class, 'storeAttachment']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/{notification}', [NotificationController::class, 'show']);
        Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);
        Route::post('reviews', [ReviewController::class, 'store']);
        Route::get('reviews/me', [ReviewController::class, 'me']);
        Route::get('reviews/{review}', [ReviewController::class, 'show']);
        Route::post('reports', [ReportController::class, 'store']);
        Route::get('reports/me', [ReportController::class, 'me']);
        Route::get('reports/{report}', [ReportController::class, 'show']);
        Route::post('disputes', [DisputeController::class, 'store']);
        Route::get('disputes', [DisputeController::class, 'index']);
        Route::get('disputes/{dispute}', [DisputeController::class, 'show']);
        Route::post('disputes/{dispute}/evidence', [DisputeController::class, 'storeEvidence']);
        Route::get('disputes/{dispute}/evidence', [DisputeController::class, 'evidence']);
        Route::get('disputes/{dispute}/messages', [DisputeController::class, 'messages']);
        Route::post('disputes/{dispute}/messages', [DisputeController::class, 'storeMessage']);
        Route::get('favorites', [FavoriteController::class, 'index']);
        Route::post('favorites', [FavoriteController::class, 'store']);
        Route::delete('favorites/{professionalProfile}', [FavoriteController::class, 'destroy']);
        Route::get('contracts', [ContractController::class, 'index']);
        Route::get('contracts/{contract}', [ContractController::class, 'show']);
        Route::post('contracts/{contract}/complete', [ContractController::class, 'complete']);
        Route::post('contracts/{contract}/cancel', [ContractController::class, 'cancel']);
        Route::get('contracts/{contract}/logs', [ContractController::class, 'logs']);
    });

    Route::middleware(['auth:sanctum', EnsureAuthenticatedUserIsActive::class, EnsureUserIsAdmin::class])->prefix('admin')->group(function (): void {
        Route::get('dashboard', AdminDashboardController::class);
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::patch('users/{user}', [AdminUserController::class, 'update']);
        Route::post('users/{user}/suspend', [AdminUserController::class, 'suspend']);
        Route::post('users/{user}/reactivate', [AdminUserController::class, 'reactivate']);
        Route::post('users/{user}/block', [AdminUserController::class, 'block']);
        Route::get('categories', [AdminCategoryController::class, 'index']);
        Route::post('categories', [AdminCategoryController::class, 'store']);
        Route::patch('categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy']);
        Route::get('skills', [AdminSkillController::class, 'index']);
        Route::post('skills', [AdminSkillController::class, 'store']);
        Route::patch('skills/{skill}', [AdminSkillController::class, 'update']);
        Route::delete('skills/{skill}', [AdminSkillController::class, 'destroy']);
        Route::get('reports', [AdminReportController::class, 'index']);
        Route::get('reports/{report}', [AdminReportController::class, 'show']);
        Route::post('reports/{report}/review', [AdminReportController::class, 'review']);
        Route::post('reports/{report}/resolve', [AdminReportController::class, 'resolve']);
        Route::post('reports/{report}/dismiss', [AdminReportController::class, 'dismiss']);
        Route::get('disputes', [AdminDisputeController::class, 'index']);
        Route::get('disputes/{dispute}', [AdminDisputeController::class, 'show']);
        Route::post('disputes/{dispute}/assign', [AdminDisputeController::class, 'assign']);
        Route::post('disputes/{dispute}/resolve', [AdminDisputeController::class, 'resolve']);
        Route::get('verifications', [AdminVerificationController::class, 'index']);
        Route::get('verifications/{professionalProfile}', [AdminVerificationController::class, 'show'])
            ->missing(fn () => AdminVerificationController::missingResponse());
        Route::post('verifications/{professionalProfile}/approve', [AdminVerificationController::class, 'approve'])
            ->missing(fn () => AdminVerificationController::missingResponse());
        Route::post('verifications/{professionalProfile}/reject', [AdminVerificationController::class, 'reject'])
            ->missing(fn () => AdminVerificationController::missingResponse());
    });

    Route::middleware(['auth:sanctum', EnsureAuthenticatedUserIsActive::class])->prefix('professional')->group(function (): void {
        Route::get('dashboard', ProfessionalDashboardController::class);
        Route::post('profile', [ProfessionalProfileController::class, 'store']);
        Route::get('profile', [ProfessionalProfileController::class, 'show']);
        Route::patch('profile', [ProfessionalProfileController::class, 'update']);
        Route::post('categories', [ProfessionalProfileController::class, 'assignCategories']);
        Route::post('skills', [ProfessionalProfileController::class, 'assignSkills']);
        Route::patch('availability', [ProfessionalProfileController::class, 'updateAvailability']);
        Route::get('invitations', [ProfessionalInvitationController::class, 'index']);
        Route::post('invitations/{invitation}/decline', [ProfessionalInvitationController::class, 'decline']);
        Route::get('portfolio', [PortfolioController::class, 'index']);
        Route::post('portfolio', [PortfolioController::class, 'store']);
        Route::delete('portfolio/{portfolioItem}', [PortfolioController::class, 'destroy']);
        Route::get('verification', [DocumentController::class, 'verification']);
        Route::get('documents', [DocumentController::class, 'index']);
        Route::post('documents', [DocumentController::class, 'store']);
        Route::get('documents/{document}/download', [DocumentController::class, 'download']);
        Route::get('documents/{document}', [DocumentController::class, 'show']);
    });
});
