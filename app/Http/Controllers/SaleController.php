<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'event_product_id' => ['required', 'exists:event_products,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            DB::transaction(function () use ($data, $event, $request) {
                // Lock the event_product row so two concurrent sales can't both
                // pass the stock check before either one commits its insert.
                $eventProduct = EventProduct::where('id', $data['event_product_id'])
                    ->where('event_id', $event->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $sold = $eventProduct->sales()->sum('quantity');
                $available = $eventProduct->quantity_made - $sold;

                if ($data['quantity'] > $available) {
                    throw ValidationException::withMessages([
                        'quantity' => "Solo quedan {$available} unidades disponibles.",
                    ]);
                }

                Sale::create([
                    'event_id' => $event->id,
                    'event_product_id' => $eventProduct->id,
                    'customer_name' => $data['customer_name'],
                    'quantity' => $data['quantity'],
                    'unit_price' => $eventProduct->unit_price,
                    'total' => $eventProduct->unit_price * $data['quantity'],
                    'paid' => false,
                    'sold_by' => $request->user()->id,
                    'notes' => $data['notes'] ?? null,
                ]);
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta registrada.');
    }

    public function update(Request $request, Sale $sale): RedirectResponse
    {
        $data = $request->validate([
            'paid' => ['required', 'boolean'],
            'payment_method' => ['required_if:paid,true', 'nullable', 'in:Efectivo,Nequi'],
        ]);

        $sale->update([
            'paid' => $data['paid'],
            'payment_method' => $data['paid'] ? $data['payment_method'] : null,
        ]);

        return back()->with('success', $data['paid'] ? 'Venta marcada como pagada.' : 'Venta marcada como pendiente.');
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        $sale->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }
}
