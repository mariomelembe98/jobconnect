<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserStatus;
use App\Enums\UserType;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name',
    'email',
    'phone',
    'password',
    'avatar',
    'user_type',
    'status',
    'email_verified_at',
    'phone_verified_at',
    'last_login_at',
    'province',
    'city',
    'address',
    'latitude',
    'longitude',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    public function professionalProfile(): HasOne
    {
        return $this->hasOne(ProfessionalProfile::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'client_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriteProfessionals(): BelongsToMany
    {
        return $this->belongsToMany(
            ProfessionalProfile::class,
            'favorites',
            'user_id',
            'professional_profile_id',
        )->withTimestamps();
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(ProfessionalInvitation::class, 'client_id');
    }

    public function clientContracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'client_id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'user_type' => UserType::class,
            'status' => UserStatus::class,
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }
}
