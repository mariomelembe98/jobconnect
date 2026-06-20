<?php

namespace App\Domains\Disputes\Actions;

use App\Models\Dispute;
use App\Models\DisputeEvidence;
use App\Models\User;
use Illuminate\Http\UploadedFile;

class StoreDisputeEvidenceAction
{
    public function execute(
        Dispute $dispute,
        User $user,
        UploadedFile $file,
        ?string $description = null,
    ): DisputeEvidence {
        $path = $file->store("disputes/{$dispute->id}/evidence", 'public');

        return $dispute->evidence()->create([
            'uploaded_by' => $user->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'description' => $description,
        ]);
    }
}
