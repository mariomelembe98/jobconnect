<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proposal_id')->constrained()->restrictOnDelete()->unique();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('professional_profile_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->decimal('platform_fee', 12, 2)->default(0);
            $table->decimal('professional_amount', 12, 2)->default(0);
            $table->string('status')->default('active')->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
