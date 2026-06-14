<?php

use App\Enums\AvailabilityStatus;
use App\Enums\VerificationStatus;
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
        Schema::create('professional_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->decimal('base_price', 12, 2)->nullable();
            $table->string('price_type')->nullable()->index();
            $table->string('province')->index();
            $table->string('city')->index();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('verification_status')->default(VerificationStatus::Pending->value)->index();
            $table->string('availability')->default(AvailabilityStatus::Available->value)->index();
            $table->decimal('average_rating', 3, 2)->default(0);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['province', 'city']);
            $table->index(['verification_status', 'availability']);
            $table->index(['average_rating', 'total_reviews']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('professional_profiles');
    }
};
