<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug', 'description', 'icon', 'status'])]
class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => 'active',
    ];

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function professionals(): BelongsToMany
    {
        return $this->belongsToMany(
            ProfessionalProfile::class,
            'professional_categories',
            'category_id',
            'professional_profile_id',
        )->withTimestamps();
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }
}
