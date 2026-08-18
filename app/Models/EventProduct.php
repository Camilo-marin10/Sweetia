<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'product_id',
        'quantity_made',
        'unit_price',
    ];

    protected $appends = [
        'quantity_sold',
        'quantity_available',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    protected function quantitySold(): Attribute
    {
        return Attribute::get(
            fn () => $this->sales_sum_quantity ?? $this->sales()->sum('quantity')
        );
    }

    protected function quantityAvailable(): Attribute
    {
        return Attribute::get(
            fn () => $this->quantity_made - $this->quantity_sold
        );
    }
}
