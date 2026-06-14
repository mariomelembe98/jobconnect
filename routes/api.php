<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Lookup\CategoryController;
use App\Http\Controllers\Api\V1\Lookup\LocationController;
use App\Http\Controllers\Api\V1\Lookup\SkillController;
use App\Http\Controllers\Api\V1\Professional\ProfileController as ProfessionalProfileController;
use App\Http\Controllers\Api\V1\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('skills', [SkillController::class, 'index']);

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

    Route::middleware('auth:sanctum')->prefix('professional')->group(function (): void {
        Route::post('profile', [ProfessionalProfileController::class, 'store']);
        Route::get('profile', [ProfessionalProfileController::class, 'show']);
        Route::patch('profile', [ProfessionalProfileController::class, 'update']);
        Route::post('categories', [ProfessionalProfileController::class, 'assignCategories']);
        Route::post('skills', [ProfessionalProfileController::class, 'assignSkills']);
        Route::patch('availability', [ProfessionalProfileController::class, 'updateAvailability']);
    });
});
