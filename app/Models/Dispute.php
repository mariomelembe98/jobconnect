<?php

namespace App\Models;

use App\Enums\DisputeResolution;
use App\Enums\DisputeStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'contract_id',
    'opened_by',
    'assigned_to',
    'reason',
    'description',
    'status',
    'resolution',
    'resolution_note',
    'resolved_at',
])]
class Dispute extends Model
{
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => DisputeStatus::Pending->value,
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(DisputeEvidence::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(DisputeMessage::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => DisputeStatus::class,
            'resolution' => DisputeResolution::class,
            'resolved_at' => 'datetime',
        ];
    }
}
