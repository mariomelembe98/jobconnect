<?php

namespace App\Models;

use App\Enums\AvailabilityStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'user_id',
    'headline',
    'bio',
    'experience_years',
    'base_price',
    'price_type',
    'province',
    'city',
    'address',
    'latitude',
    'longitude',
    'verification_status',
    'availability',
    'average_rating',
    'total_reviews',
])]
class ProfessionalProfile extends Model
{
    use HasFactory, SoftDeletes;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            Category::class,
            'professional_categories',
            'professional_profile_id',
            'category_id',
        )->withTimestamps();
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(
            Skill::class,
            'professional_skills',
            'professional_profile_id',
            'skill_id',
        )->withTimestamps();
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(ProfessionalPortfolioItem::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProfessionalDocument::class);
    }

    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'favorites',
            'professional_profile_id',
            'user_id',
        )->withTimestamps();
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(ProfessionalInvitation::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'base_price' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'verification_status' => VerificationStatus::class,
            'availability' => AvailabilityStatus::class,
            'average_rating' => 'decimal:2',
            'total_reviews' => 'integer',
        ];
    }
}
