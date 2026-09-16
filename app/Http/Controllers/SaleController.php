<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
                        'amount_paid' => 0,
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
            'paid' => ['sometimes', 'boolean'],
            'payment_method' => ['nullable', 'required_if:paid,true', 'required_with:abono', 'in:Efectivo,Nequi'],
            'abono' => ['sometimes', 'numeric', 'min:0.01'],
            'delivered' => ['sometimes', 'boolean'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($sale, $data) {
                $payload = [];

                if (array_key_exists('quantity', $data)) {
                    $payload = [...$payload, ...$this->quantityUpdatePayload($sale, $data['quantity'])];
                }

                $total = $payload['total'] ?? $sale->total;

                $payload = [...$payload, ...$this->paymentUpdatePayload($sale, $data, $total)];

                if (array_key_exists('delivered', $data)) {
                    $payload['delivered'] = $data['delivered'];
                }

                if (array_key_exists('customer_name', $data)) {
                    $payload['customer_name'] = $data['customer_name'];
                }

                $sale->update($payload);
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta actualizada.');
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        $sale->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }

    public function updateGroup(Request $request, string $groupId): RedirectResponse
    {
        $data = $request->validate([
            'paid' => ['sometimes', 'boolean'],
            'payment_method' => ['nullable', 'required_if:paid,true', 'required_with:abono', 'in:Efectivo,Nequi'],
            'abono' => ['sometimes', 'numeric', 'min:0.01'],
            'delivered' => ['sometimes', 'boolean'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['required_with:items', Rule::exists('sales', 'id')->where('group_id', $groupId)],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
        ]);

        try {
            DB::transaction(function () use ($groupId, $data) {
                foreach ($data['items'] ?? [] as $item) {
                    $sale = Sale::where('id', $item['id'])->where('group_id', $groupId)->lockForUpdate()->firstOrFail();
                    $sale->update($this->quantityUpdatePayload($sale, $item['quantity']));
                }

                $commonPayload = [];

                if (array_key_exists('delivered', $data)) {
                    $commonPayload['delivered'] = $data['delivered'];
                }

                if (array_key_exists('customer_name', $data)) {
                    $commonPayload['customer_name'] = $data['customer_name'];
                }

                if (! empty($commonPayload)) {
                    Sale::where('group_id', $groupId)->update($commonPayload);
                }

                if (array_key_exists('abono', $data) || array_key_exists('paid', $data)) {
                    $sales = Sale::where('group_id', $groupId)->lockForUpdate()->orderBy('id')->get();
                    $this->applyGroupPayment($sales, $data);
                }
            });
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return back()->with('success', 'Venta actualizada.');
    }

    public function destroyGroup(string $groupId): RedirectResponse
    {
        Sale::where('group_id', $groupId)->delete();

        return back()->with('success', 'Venta anulada, stock repuesto.');
    }

    /**
     * A partial payment (abono) or a full "mark as paid" toggle both need to
     * agree on how much of the sale's total is covered, so they're resolved
     * together here rather than as independent field updates.
     */
    private function paymentUpdatePayload(Sale $sale, array $data, float $total): array
    {
        if (array_key_exists('abono', $data)) {
            $amountPaid = min($sale->amount_paid + $data['abono'], $total);

            return [
                'amount_paid' => $amountPaid,
                'paid' => $total > 0 && $amountPaid >= $total,
                'payment_method' => $data['payment_method'],
            ];
        }

        if (array_key_exists('paid', $data)) {
            return [
                'paid' => $data['paid'],
                'payment_method' => $data['paid'] ? ($data['payment_method'] ?? null) : null,
                'amount_paid' => $data['paid'] ? $total : 0,
            ];
        }

        return [];
    }

    /**
     * Applies an abono or a full paid/pending toggle across every sale in a
     * group. An abono is allocated across the group's sales in order, filling
     * each one's own total before spilling into the next — the same way a
     * customer's lump-sum payment would be applied against several products.
     */
    private function applyGroupPayment(Collection $sales, array $data): void
    {
        if (array_key_exists('abono', $data)) {
            $remaining = $sales->sum('amount_paid') + $data['abono'];

            foreach ($sales as $sale) {
                $allocated = min((float) $sale->total, $remaining);
                $remaining -= $allocated;

                $sale->update([
                    'amount_paid' => $allocated,
                    'paid' => $sale->total > 0 && $allocated >= $sale->total,
                    'payment_method' => $data['payment_method'],
                ]);
            }

            return;
        }

        $paid = $data['paid'];

        foreach ($sales as $sale) {
            $sale->update([
                'paid' => $paid,
                'payment_method' => $paid ? ($data['payment_method'] ?? null) : null,
                'amount_paid' => $paid ? $sale->total : 0,
            ]);
        }
    }

    /**
     * Re-checks stock for this sale's product excluding its own current
     * quantity, and returns the quantity/total columns to save. Also clamps
     * amount_paid to the new total so a lowered quantity can't leave the sale
     * showing as paid for more than it's actually worth.
     */
    private function quantityUpdatePayload(Sale $sale, int $quantity): array
    {
        $eventProduct = EventProduct::where('id', $sale->event_product_id)
            ->lockForUpdate()
            ->with('product')
            ->firstOrFail();

        $soldElsewhere = $eventProduct->sales()->where('id', '!=', $sale->id)->sum('quantity');
        $available = $eventProduct->quantity_made - $soldElsewhere;

        if ($quantity > $available) {
            throw ValidationException::withMessages([
                'items' => "Solo quedan {$available} unidades de \"{$eventProduct->product->name}\" disponibles.",
            ]);
        }

        $total = $eventProduct->unit_price * $quantity;
        $amountPaid = min((float) $sale->amount_paid, $total);

        return [
            'quantity' => $quantity,
            'total' => $total,
            'amount_paid' => $amountPaid,
            'paid' => $total > 0 && $amountPaid >= $total,
            'payment_method' => ($total > 0 && $amountPaid >= $total) ? $sale->payment_method : null,
        ];
    }
}
