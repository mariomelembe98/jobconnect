<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['category_id', 'name', 'slug', 'description', 'status'])]
class Skill extends Model
{
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => 'active',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function professionals(): BelongsToMany
    {
        return $this->belongsToMany(
            ProfessionalProfile::class,
            'professional_skills',
            'skill_id',
            'professional_profile_id',
        )->withTimestamps();
    }
}
