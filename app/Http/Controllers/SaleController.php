<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.event_product_id' => [
                'required',
                'distinct',
                Rule::exists('event_products', 'id')->where('event_id', $event->id),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($data, $event, $request) {
                // Every line of the same checkout shares a group_id so the UI can
                // present them as one order while stock/reports still see each
                // product's own Sale row.
                $groupId = Str::uuid()->toString();

                foreach ($data['items'] as $item) {
                    // Lock the event_product row so two concurrent sales can't both
                    // pass the stock check before either one commits its insert.
                    $eventProduct = EventProduct::where('id', $item['event_product_id'])
                        ->where('event_id', $event->id)
                        ->lockForUpdate()
                        ->with('product')
                        ->firstOrFail();

                    $sold = $eventProduct->sales()->sum('quantity');
                    $available = $eventProduct->quantity_made - $sold;

                    if ($item['quantity'] > $available) {
                        throw ValidationException::withMessages([
                            'items' => "Solo quedan {$available} unidades de \"{$eventProduct->product->name}\" disponibles.",
                        ]);
                    }

                    Sale::create([
                        'event_id' => $event->id,
                        'group_id' => $groupId,
                        'event_product_id' => $eventProduct->id,
                        'customer_name' => $data['customer_name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $eventProduct->unit_price,
                        'total' => $eventProduct->unit_price * $item['quantity'],
                        'paid' => false,
                        'sold_by' => $request->user()->id,
                    ]);
                }
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

    public function updateGroup(Request $request, string $groupId): RedirectResponse
    {
        $data = $request->validate([
            'paid' => ['required', 'boolean'],
            'payment_method' => ['required_if:paid,true', 'nullable', 'in:Efectivo,Nequi'],
        ]);

        Sale::where('group_id', $groupId)->update([
            'paid' => $data['paid'],
            'payment_method' => $data['paid'] ? $data['payment_method'] : null,
        ]);

        return back()->with('success', $data['paid'] ? 'Venta marcada como pagada.' : 'Venta marcada como pendiente.');
    }

    public function destroyGroup(string $groupId): RedirectResponse
    {
        Sale::where('group_id', $groupId)->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }
}
