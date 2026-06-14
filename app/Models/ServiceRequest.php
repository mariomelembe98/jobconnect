<?php

namespace App\Models;

use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'client_id',
    'category_id',
    'title',
    'description',
    'service_type',
    'budget_min',
    'budget_max',
    'budget_type',
    'province',
    'city',
    'address',
    'latitude',
    'longitude',
    'deadline_at',
    'status',
    'visibility',
])]
class ServiceRequest extends Model
{
    use HasFactory, SoftDeletes;

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ServiceRequestAttachment::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'deadline_at' => 'datetime',
            'status' => ServiceRequestStatus::class,
        ];
    }
}
