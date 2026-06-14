<?php

use App\Http\Controllers\Api\V1\Admin\VerificationController as AdminVerificationController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Client\ServiceRequestController as ClientServiceRequestController;
use App\Http\Controllers\Api\V1\Lookup\CategoryController;
use App\Http\Controllers\Api\V1\Lookup\LocationController;
use App\Http\Controllers\Api\V1\Lookup\SkillController;
use App\Http\Controllers\Api\V1\Professional\DocumentController;
use App\Http\Controllers\Api\V1\Professional\PortfolioController;
use App\Http\Controllers\Api\V1\Professional\ProfileController as ProfessionalProfileController;
use App\Http\Controllers\Api\V1\ProfessionalDirectoryController;
use App\Http\Controllers\Api\V1\ServiceRequestController;
use App\Http\Controllers\Api\V1\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('skills', [SkillController::class, 'index']);
    Route::get('professionals', [ProfessionalDirectoryController::class, 'index']);
    Route::get('professionals/{professionalProfile}', [ProfessionalDirectoryController::class, 'show'])
        ->missing(fn () => ProfessionalDirectoryController::missingResponse());

    Route::prefix('locations')->group(function (): void {
        Route::get('provinces', [LocationController::class, 'provinces']);
        Route::get('cities', [LocationController::class, 'cities']);
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:sanctum')->prefix('users/me')->group(function (): void {
        Route::get('/', [UserProfileController::class, 'show']);
        Route::patch('/', [UserProfileController::class, 'update']);
        Route::patch('location', [UserProfileController::class, 'updateLocation']);
        Route::patch('password', [UserProfileController::class, 'changePassword']);
    });

    Route::get('service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('service-requests', [ServiceRequestController::class, 'index']);
        Route::post('service-requests', [ServiceRequestController::class, 'store']);
        Route::patch('service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']);
        Route::post('service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
        Route::post('service-requests/{serviceRequest}/attachments', [ServiceRequestController::class, 'storeAttachments']);
        Route::delete('service-requests/{serviceRequest}/attachments/{attachment}', [ServiceRequestController::class, 'destroyAttachment']);
        Route::get('client/service-requests', [ClientServiceRequestController::class, 'index']);
    });

    Route::middleware('auth:sanctum')->prefix('admin')->group(function (): void {
        Route::get('verifications', [AdminVerificationController::class, 'index']);
        Route::get('verifications/{professionalProfile}', [AdminVerificationController::class, 'show'])
            ->missing(fn () => AdminVerificationController::missingResponse());
        Route::post('verifications/{professionalProfile}/approve', [AdminVerificationController::class, 'approve'])
            ->missing(fn () => AdminVerificationController::missingResponse());
        Route::post('verifications/{professionalProfile}/reject', [AdminVerificationController::class, 'reject'])
            ->missing(fn () => AdminVerificationController::missingResponse());
    });

    Route::middleware('auth:sanctum')->prefix('professional')->group(function (): void {
        Route::post('profile', [ProfessionalProfileController::class, 'store']);
        Route::get('profile', [ProfessionalProfileController::class, 'show']);
        Route::patch('profile', [ProfessionalProfileController::class, 'update']);
        Route::post('categories', [ProfessionalProfileController::class, 'assignCategories']);
        Route::post('skills', [ProfessionalProfileController::class, 'assignSkills']);
        Route::patch('availability', [ProfessionalProfileController::class, 'updateAvailability']);
        Route::get('portfolio', [PortfolioController::class, 'index']);
        Route::post('portfolio', [PortfolioController::class, 'store']);
        Route::delete('portfolio/{portfolioItem}', [PortfolioController::class, 'destroy']);
        Route::get('verification', [DocumentController::class, 'verification']);
        Route::get('documents', [DocumentController::class, 'index']);
        Route::post('documents', [DocumentController::class, 'store']);
        Route::get('documents/{document}', [DocumentController::class, 'show']);
    });
});
