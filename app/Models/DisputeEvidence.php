<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'dispute_id',
    'uploaded_by',
    'file_path',
    'file_name',
    'file_type',
    'file_size',
    'description',
])]
class DisputeEvidence extends Model
{
    use HasFactory;

    protected $table = 'dispute_evidence';

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(Dispute::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['file_size' => 'integer'];
    }
}
