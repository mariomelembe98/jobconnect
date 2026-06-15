<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'message_id',
    'file_path',
    'file_name',
    'file_type',
    'file_size',
])]
class MessageAttachment extends Model
{
    use HasFactory;

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
