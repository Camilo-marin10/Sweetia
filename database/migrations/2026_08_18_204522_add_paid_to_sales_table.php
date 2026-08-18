<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->boolean('paid')->default(false)->after('payment_method');
        });

        // Sales that already had a payment method recorded were, in practice,
        // registered as already paid under the old flow — preserve that intent.
        DB::table('sales')->whereNotNull('payment_method')->update(['paid' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('paid');
        });
    }
};
