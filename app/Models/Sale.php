<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'group_id',
        'event_product_id',
        'customer_name',
        'quantity',
        'unit_price',
        'total',
        'payment_method',
        'paid',
        'sold_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'paid' => 'boolean',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function eventProduct(): BelongsTo
    {
        return $this->belongsTo(EventProduct::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sold_by');
    }
}
