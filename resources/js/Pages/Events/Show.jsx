import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { Head, useForm, router } from "@inertiajs/react";
import { useEffect, useState } from "react";

const money = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

export default function Show({
    event,
    eventProducts,
    sales,
    expenses,
    summary,
    availableProducts,
}) {
    return (
        <AuthenticatedLayout
            header={<EventHeader event={event} />}
        >
            <Head title={event.name} />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <SummaryCards summary={summary} />
                    <EventProductsSection
                        event={event}
                        eventProducts={eventProducts}
                        availableProducts={availableProducts}
                    />
                    <SalesSection
                        event={event}
                        eventProducts={eventProducts}
                        sales={sales}
                    />
                    <ExpensesSection
                        event={event}
                        eventProducts={eventProducts}
                        expenses={expenses}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function EventHeader({ event }) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <EventEditForm
                event={event}
                onDone={() => setEditing(false)}
                onCancel={() => setEditing(false)}
            />
        );
    }

    const destroy = () => {
        if (
            confirm(
                `¿Eliminar el evento "${event.name}"? También se borrarán sus productos, ventas y gastos. Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(route("events.destroy", event.id));
        }
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d15d8e]">
                    Evento
                </p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#241b2a]">
                    {event.name}
                </h2>
                <p className="mt-1 text-sm text-[#6e6774]">
                    {new Date(
                        event.event_date + "T00:00:00",
                    ).toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <StatusSelect event={event} />
                <button
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                >
                    Editar
                </button>
                <button
                    onClick={destroy}
                    className="text-sm font-medium text-[#d85c68] hover:text-[#b6404a]"
                >
                    Eliminar evento
                </button>
            </div>
        </div>
    );
}

function EventEditForm({ event, onDone, onCancel }) {
    const form = useForm({
        name: event.name,
        event_date: event.event_date,
        notes: event.notes ?? "",
        status: event.status,
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(route("events.update", event.id), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-wrap items-end gap-4 rounded-[20px] border border-[#f2dce7] bg-[#fffafc] p-4"
        >
            <div className="min-w-[220px] flex-1">
                <InputLabel htmlFor="edit_name" value="Nombre del evento" />
                <TextInput
                    id="edit_name"
                    value={form.data.name}
                    onChange={(e) => form.setData("name", e.target.value)}
                    className="mt-2 block w-full"
                />
                <InputError message={form.errors.name} className="mt-1" />
            </div>
            <div className="min-w-[160px]">
                <InputLabel htmlFor="edit_event_date" value="Fecha" />
                <TextInput
                    id="edit_event_date"
                    type="date"
                    value={form.data.event_date}
                    onChange={(e) =>
                        form.setData("event_date", e.target.value)
                    }
                    className="mt-2 block w-full"
                />
                <InputError message={form.errors.event_date} className="mt-1" />
            </div>
            <div className="min-w-[220px] flex-1">
                <InputLabel htmlFor="edit_notes" value="Notas" />
                <TextInput
                    id="edit_notes"
                    value={form.data.notes}
                    onChange={(e) => form.setData("notes", e.target.value)}
                    className="mt-2 block w-full"
                />
                <InputError message={form.errors.notes} className="mt-1" />
            </div>
            <div className="flex gap-3 pb-1">
                <PrimaryButton disabled={form.processing}>
                    Guardar
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancelar
                </SecondaryButton>
            </div>
        </form>
    );
}

function StatusSelect({ event }) {
    const handleChange = (e) => {
        router.put(
            route("events.update", event.id),
            {
                name: event.name,
                event_date: event.event_date,
                notes: event.notes,
                status: e.target.value,
            },
            { preserveScroll: true },
        );
    };

    return (
        <select
            value={event.status}
            onChange={handleChange}
            className="field-input max-w-[180px] cursor-pointer border-[#f0d8e5] bg-[#fffafc] px-3 py-2 text-sm font-medium text-[#4b3b4b]"
        >
            <option value="planificado">Planificado</option>
            <option value="activo">Activo</option>
            <option value="cerrado">Cerrado</option>
        </select>
    );
}

function SummaryCards({ summary }) {
    const cards = [
        {
            label: "Ingresos (pagado)",
            value: summary.income,
            tone: "text-gray-900",
        },
        {
            label: "Por cobrar",
            value: summary.pending,
            tone: summary.pending > 0 ? "text-amber-600" : "text-gray-900",
        },
        { label: "Gastos", value: summary.expenses, tone: "text-gray-900" },
        {
            label: "Ganancia",
            value: summary.profit,
            tone: summary.profit >= 0 ? "text-green-600" : "text-red-600",
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div key={card.label} className="metric-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a6876]">
                        {card.label}
                    </p>
                    <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>
                        {money(card.value)}
                    </p>
                </div>
            ))}
        </div>
    );
}

function EventProductsSection({ event, eventProducts, availableProducts }) {
    const addForm = useForm({
        product_id: availableProducts[0]?.id ?? "",
        quantity_made: "",
        unit_price: "",
    });

    const [editingId, setEditingId] = useState(null);

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route("event-products.store", event.id), {
            preserveScroll: true,
            onSuccess: () => addForm.reset("quantity_made", "unit_price"),
        });
    };

    const removeProduct = (eventProduct) => {
        if (confirm(`¿Quitar "${eventProduct.product.name}" de este evento?`)) {
            router.delete(route("event-products.destroy", eventProduct.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <section className="app-panel overflow-hidden">
            <div className="section-head">
                <h3 className="text-lg font-semibold text-[#241b2a]">
                    Productos del evento
                </h3>
            </div>

            <div className="overflow-x-auto p-4 sm:p-5">
                <table className="data-table min-w-[980px]">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Hecho</th>
                            <th>Vendido</th>
                            <th>Disponible</th>
                            <th>Precio</th>
                            <th>Costo/u</th>
                            <th>Ganancia/u</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventProducts.map((ep) => (
                            <EventProductRow
                                key={ep.id}
                                eventProduct={ep}
                                editing={editingId === ep.id}
                                onEdit={() => setEditingId(ep.id)}
                                onCancelEdit={() => setEditingId(null)}
                                onRemove={() => removeProduct(ep)}
                            />
                        ))}
                        {eventProducts.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="py-6 text-center text-[#6e6774]"
                                >
                                    Todavía no has agregado productos a este
                                    evento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-[#f4dfe8] bg-[#fffafc] p-5">
                {availableProducts.length > 0 ? (
                    <form
                        onSubmit={submitAdd}
                        className="flex flex-wrap items-end gap-4"
                    >
                        <div className="min-w-[180px]">
                            <InputLabel htmlFor="product_id" value="Producto" />
                            <select
                                id="product_id"
                                value={addForm.data.product_id}
                                onChange={(e) =>
                                    addForm.setData(
                                        "product_id",
                                        e.target.value,
                                    )
                                }
                                className="field-input mt-2 block w-full"
                            >
                                {availableProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={addForm.errors.product_id}
                                className="mt-1"
                            />
                        </div>
                        <div className="min-w-[150px]">
                            <InputLabel
                                htmlFor="quantity_made"
                                value="Cantidad hecha"
                            />
                            <TextInput
                                id="quantity_made"
                                type="number"
                                min="1"
                                value={addForm.data.quantity_made}
                                onChange={(e) =>
                                    addForm.setData(
                                        "quantity_made",
                                        e.target.value,
                                    )
                                }
                                className="mt-2 block w-full"
                            />
                            <InputError
                                message={addForm.errors.quantity_made}
                                className="mt-1"
                            />
                        </div>
                        <div className="min-w-[160px]">
                            <InputLabel
                                htmlFor="unit_price"
                                value="Precio de venta"
                            />
                            <TextInput
                                id="unit_price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={addForm.data.unit_price}
                                onChange={(e) =>
                                    addForm.setData(
                                        "unit_price",
                                        e.target.value,
                                    )
                                }
                                className="mt-2 block w-full"
                            />
                            <InputError
                                message={addForm.errors.unit_price}
                                className="mt-1"
                            />
                        </div>
                        <div className="pt-6">
                            <PrimaryButton disabled={addForm.processing}>
                                Agregar
                            </PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <p className="text-sm text-[#6e6774]">
                        Primero crea productos en el catálogo para poder
                        agregarlos aquí.
                    </p>
                )}
            </div>
        </section>
    );
}

function EventProductRow({
    eventProduct,
    editing,
    onEdit,
    onCancelEdit,
    onRemove,
}) {
    const form = useForm({
        quantity_made: eventProduct.quantity_made,
        unit_price: eventProduct.unit_price,
    });

    if (!editing) {
        return (
            <tr>
                <td className="font-semibold text-[#241b2a]">
                    {eventProduct.product.name}
                </td>
                <td>{eventProduct.quantity_made}</td>
                <td>{eventProduct.quantity_sold}</td>
                <td>
                    <span
                        className={
                            eventProduct.quantity_available <= 0
                                ? "font-semibold text-[#d85c68]"
                                : "font-medium text-[#241b2a]"
                        }
                    >
                        {eventProduct.quantity_available}
                    </span>
                </td>
                <td>{money(eventProduct.unit_price)}</td>
                <td className="text-[#6e6774]">
                    {money(eventProduct.cost_per_unit)}
                </td>
                <td>
                    <span
                        className={
                            eventProduct.profit_per_unit >= 0
                                ? "font-semibold text-[#1f9d72]"
                                : "font-semibold text-[#d85c68]"
                        }
                    >
                        {money(eventProduct.profit_per_unit)}
                    </span>
                </td>
                <td className="text-right">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onEdit}
                            className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                        >
                            Editar
                        </button>
                        <button
                            onClick={onRemove}
                            className="text-sm font-medium text-[#d85c68] hover:text-[#b6404a]"
                        >
                            Quitar
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        form.put(route("event-products.update", eventProduct.id), {
            preserveScroll: true,
            onSuccess: onCancelEdit,
        });
    };

    return (
        <tr className="bg-[#fff7fb]">
            <td className="font-semibold text-[#241b2a]">
                {eventProduct.product.name}
            </td>
            <td>
                <TextInput
                    type="number"
                    min={eventProduct.quantity_sold}
                    value={form.data.quantity_made}
                    onChange={(e) =>
                        form.setData("quantity_made", e.target.value)
                    }
                    className="block w-20"
                />
                <InputError
                    message={form.errors.quantity_made}
                    className="mt-1"
                />
            </td>
            <td className="text-[#6e6774]">{eventProduct.quantity_sold}</td>
            <td>
                {(Number(form.data.quantity_made) || 0) -
                    eventProduct.quantity_sold}
            </td>
            <td>
                <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.data.unit_price}
                    onChange={(e) => form.setData("unit_price", e.target.value)}
                    className="block w-24"
                />
                <InputError message={form.errors.unit_price} className="mt-1" />
            </td>
            <td className="text-[#6e6774]">
                {money(eventProduct.cost_per_unit)}
            </td>
            <td>
                <span
                    className={
                        eventProduct.profit_per_unit >= 0
                            ? "font-semibold text-[#1f9d72]"
                            : "font-semibold text-[#d85c68]"
                    }
                >
                    {money(eventProduct.profit_per_unit)}
                </span>
            </td>
            <td className="text-right">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={submit}
                        disabled={form.processing}
                        className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                    >
                        Guardar
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="text-sm font-medium text-[#6e6774] hover:text-[#241b2a]"
                    >
                        Cancelar
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SalesSection({ event, eventProducts, sales }) {
    const sellable = eventProducts.filter((ep) => ep.quantity_available > 0);

    const [customerName, setCustomerName] = useState("");
    const [cart, setCart] = useState([]); // [{ event_product_id, product_name, unit_price, quantity }]
    const [pickProductId, setPickProductId] = useState(sellable[0]?.id ?? "");
    const [pickQuantity, setPickQuantity] = useState(1);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [editingSaleKey, setEditingSaleKey] = useState(null);

    const sellableIds = sellable.map((ep) => ep.id).join(",");
    useEffect(() => {
        if (
            sellable.length > 0 &&
            !sellable.some((ep) => ep.id === pickProductId)
        ) {
            setPickProductId(sellable[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellableIds]);

    const inCart = (eventProductId) =>
        cart.find((item) => item.event_product_id === eventProductId);

    const remainingFor = (ep) =>
        ep.quantity_available - (inCart(ep.id)?.quantity ?? 0);

    const pickableProducts = sellable.filter((ep) => remainingFor(ep) > 0);
    const pickedProduct = pickableProducts.find(
        (ep) => ep.id === pickProductId,
    );
    const pickMax = pickedProduct ? remainingFor(pickedProduct) : 0;

    useEffect(() => {
        if (
            pickableProducts.length > 0 &&
            !pickableProducts.some((ep) => ep.id === pickProductId)
        ) {
            setPickProductId(pickableProducts[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, sellableIds]);

    const addToCart = (e) => {
        e.preventDefault();
        if (!pickedProduct) return;

        const quantity = Math.min(
            Math.max(1, Number(pickQuantity) || 1),
            pickMax,
        );

        setCart((current) => {
            const existing = current.find(
                (item) => item.event_product_id === pickedProduct.id,
            );
            if (existing) {
                return current.map((item) =>
                    item.event_product_id === pickedProduct.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item,
                );
            }
            return [
                ...current,
                {
                    event_product_id: pickedProduct.id,
                    product_name: pickedProduct.product.name,
                    unit_price: pickedProduct.unit_price,
                    quantity,
                },
            ];
        });
        setPickQuantity(1);
    };

    const removeFromCart = (eventProductId) => {
        setCart((current) =>
            current.filter((item) => item.event_product_id !== eventProductId),
        );
    };

    const cartTotal = cart.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
    );

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post(
            route("sales.store", event.id),
            {
                customer_name: customerName,
                items: cart.map((item) => ({
                    event_product_id: item.event_product_id,
                    quantity: item.quantity,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCustomerName("");
                    setCart([]);
                },
                onError: (e) => setErrors(e),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <section className="app-panel overflow-hidden">
            <div className="section-head">
                <h3 className="text-lg font-semibold text-[#241b2a]">Ventas</h3>
            </div>

            <div className="p-5 sm:p-6">
                {sellable.length > 0 ? (
                    <div className="mb-6 rounded-[20px] border border-[#f2dce7] bg-[#fffafc] p-4 sm:p-5">
                        <div className="mb-4">
                            <InputLabel
                                htmlFor="customer_name"
                                value="Cliente"
                            />
                            <TextInput
                                id="customer_name"
                                value={customerName}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                                className="mt-2 block w-full max-w-[300px]"
                                placeholder="Nombre del cliente"
                            />
                            <InputError
                                message={errors.customer_name}
                                className="mt-1"
                            />
                        </div>

                        {pickableProducts.length > 0 && (
                            <form
                                onSubmit={addToCart}
                                className="mb-4 flex flex-wrap items-end gap-4"
                            >
                                <div className="min-w-[200px]">
                                    <InputLabel
                                        htmlFor="pick_product"
                                        value="Producto"
                                    />
                                    <select
                                        id="pick_product"
                                        value={pickProductId}
                                        onChange={(e) =>
                                            setPickProductId(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="field-input mt-2 block w-full"
                                    >
                                        {pickableProducts.map((ep) => (
                                            <option key={ep.id} value={ep.id}>
                                                {ep.product.name} (
                                                {remainingFor(ep)} disp.)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="min-w-[130px]">
                                    <InputLabel
                                        htmlFor="pick_quantity"
                                        value="Cantidad"
                                    />
                                    <TextInput
                                        id="pick_quantity"
                                        type="number"
                                        min="1"
                                        max={pickMax}
                                        value={pickQuantity}
                                        onChange={(e) =>
                                            setPickQuantity(e.target.value)
                                        }
                                        className="mt-2 block w-full"
                                    />
                                </div>
                                <div className="pt-6">
                                    <SecondaryButton type="submit">
                                        + Agregar al pedido
                                    </SecondaryButton>
                                </div>
                            </form>
                        )}

                        {cart.length > 0 && (
                            <div className="space-y-3">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Subtotal</th>
                                            <th className="text-right">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item) => (
                                            <tr key={item.event_product_id}>
                                                <td className="font-semibold text-[#241b2a]">
                                                    {item.product_name}
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>
                                                    {money(
                                                        item.unit_price *
                                                            item.quantity,
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.event_product_id,
                                                            )
                                                        }
                                                        className="text-sm font-medium text-[#d85c68] hover:text-[#b6404a]"
                                                    >
                                                        Quitar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-sm font-semibold text-[#241b2a]">
                                        Total: {money(cartTotal)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <InputError message={errors.items} className="mt-3" />

                        <div className="mt-4">
                            <PrimaryButton
                                onClick={submit}
                                disabled={
                                    processing ||
                                    cart.length === 0 ||
                                    !customerName.trim()
                                }
                            >
                                Registrar venta
                                {cart.length > 1
                                    ? ` (${cart.length} productos)`
                                    : ""}
                            </PrimaryButton>
                        </div>
                    </div>
                ) : (
                    <p className="mb-6 text-sm text-[#6e6774]">
                        No hay stock disponible para vender. Agrega productos al
                        evento primero.
                    </p>
                )}

                <div className="overflow-x-auto">
                    <table className="data-table min-w-[980px]">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Entrega</th>
                                <th>Vendido por</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupSales(sales).map((group) => {
                                const key =
                                    group[0].group_id ??
                                    `single-${group[0].id}`;
                                return (
                                    <SaleGroupRow
                                        key={key}
                                        group={group}
                                        editing={editingSaleKey === key}
                                        onEdit={() => setEditingSaleKey(key)}
                                        onCancelEdit={() =>
                                            setEditingSaleKey(null)
                                        }
                                    />
                                );
                            })}
                            {sales.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-6 text-center text-[#6e6774]"
                                    >
                                        Todavía no hay ventas registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// Sales made in the same checkout share a group_id — fold them into one row
// while every underlying Sale row still discounts its own product's stock.
function groupSales(sales) {
    const order = [];
    const groups = new Map();

    sales.forEach((sale) => {
        const key = sale.group_id ?? `single-${sale.id}`;
        if (!groups.has(key)) {
            groups.set(key, []);
            order.push(key);
        }
        groups.get(key).push(sale);
    });

    return order.map((key) => groups.get(key));
}

function SaleGroupRow({ group, editing, onEdit, onCancelEdit }) {
    const first = group[0];
    const isGroup = group.length > 1;
    const totalQuantity = group.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalAmount = group.reduce((sum, sale) => sum + sale.total, 0);
    const totalPaid = group.reduce((sum, sale) => sum + sale.amount_paid, 0);

    const updateRoute = () =>
        isGroup
            ? route("sales.group.update", first.group_id)
            : route("sales.update", first.id);
    const destroyRoute = () =>
        isGroup
            ? route("sales.group.destroy", first.group_id)
            : route("sales.destroy", first.id);

    if (editing) {
        return (
            <SaleGroupEditRow
                group={group}
                isGroup={isGroup}
                updateRoute={updateRoute()}
                onDone={onCancelEdit}
                onCancel={onCancelEdit}
            />
        );
    }

    const markPending = () => {
        router.put(
            updateRoute(),
            { paid: false, payment_method: null },
            { preserveScroll: true },
        );
    };

    const abonar = (amount, method) => {
        router.put(
            updateRoute(),
            { abono: amount, payment_method: method },
            { preserveScroll: true },
        );
    };

    const toggleDelivered = (delivered) => {
        router.put(updateRoute(), { delivered }, { preserveScroll: true });
    };

    const cancel = () => {
        const label = isGroup
            ? `el pedido de "${first.customer_name}" (${group.length} productos)`
            : `la venta de "${first.customer_name}"`;
        if (confirm(`¿Anular ${label}? El stock se repone.`)) {
            router.delete(destroyRoute(), { preserveScroll: true });
        }
    };

    return (
        <tr className="align-top">
            <td className="font-semibold text-[#241b2a]">
                {first.customer_name}
            </td>
            <td>
                {isGroup ? (
                    <ul className="space-y-1">
                        {group.map((sale) => (
                            <li key={sale.id} className="text-[#4b3b4b]">
                                {sale.product_name}{" "}
                                <span className="text-[#8a7d88]">
                                    x{sale.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-[#4b3b4b]">{first.product_name}</span>
                )}
            </td>
            <td>{totalQuantity}</td>
            <td className="font-semibold text-[#241b2a]">
                {money(totalAmount)}
            </td>
            <td>
                <SaleStatusCell
                    paid={totalAmount > 0 && totalPaid >= totalAmount}
                    paymentMethod={first.payment_method}
                    total={totalAmount}
                    amountPaid={totalPaid}
                    onMarkPending={markPending}
                    onAbono={abonar}
                />
            </td>
            <td>
                <DeliveryStatusCell
                    delivered={first.delivered}
                    onToggle={toggleDelivered}
                />
            </td>
            <td className="text-[#6e6774]">{first.sold_by}</td>
            <td className="text-right">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onEdit}
                        className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                    >
                        Editar
                    </button>
                    <button
                        onClick={cancel}
                        className="text-sm font-medium text-[#d85c68] hover:text-[#b6404a]"
                    >
                        Anular
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SaleGroupEditRow({ group, isGroup, updateRoute, onDone, onCancel }) {
    const first = group[0];
    const form = useForm(
        isGroup
            ? {
                  customer_name: first.customer_name,
                  items: group.map((sale) => ({
                      id: sale.id,
                      product_name: sale.product_name,
                      unit_price: sale.unit_price,
                      quantity: sale.quantity,
                  })),
              }
            : {
                  customer_name: first.customer_name,
                  quantity: first.quantity,
              },
    );

    const setItemQuantity = (id, quantity) => {
        form.setData(
            "items",
            form.data.items.map((item) =>
                item.id === id ? { ...item, quantity } : item,
            ),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) =>
            isGroup
                ? {
                      customer_name: data.customer_name,
                      items: data.items.map(({ id, quantity }) => ({
                          id,
                          quantity,
                      })),
                  }
                : data,
        );
        form.put(updateRoute, {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    // Payment/delivery status aren't part of this edit — they keep their own
    // one-click controls so toggling them doesn't require saving/discarding
    // whatever quantity or name change is still in progress here.
    const markPending = () => {
        router.put(
            updateRoute,
            { paid: false, payment_method: null },
            { preserveScroll: true },
        );
    };

    const abonar = (amount, method) => {
        router.put(
            updateRoute,
            { abono: amount, payment_method: method },
            { preserveScroll: true },
        );
    };

    const toggleDelivered = (delivered) => {
        router.put(updateRoute, { delivered }, { preserveScroll: true });
    };

    // Payment reflects the sale rows as saved, not the in-progress quantity
    // edit below, since that edit hasn't been submitted yet.
    const savedTotal = group.reduce((sum, sale) => sum + sale.total, 0);
    const savedPaid = group.reduce((sum, sale) => sum + sale.amount_paid, 0);

    const liveQuantity = isGroup
        ? form.data.items.reduce(
              (sum, item) => sum + (Number(item.quantity) || 0),
              0,
          )
        : Number(form.data.quantity) || 0;

    const liveTotal = isGroup
        ? form.data.items.reduce(
              (sum, item) =>
                  sum + (Number(item.quantity) || 0) * item.unit_price,
              0,
          )
        : (Number(form.data.quantity) || 0) * first.unit_price;

    return (
        <tr className="bg-[#fff7fb] align-top">
            <td>
                <TextInput
                    value={form.data.customer_name}
                    onChange={(e) =>
                        form.setData("customer_name", e.target.value)
                    }
                    className="block w-32"
                />
                <InputError
                    message={form.errors.customer_name}
                    className="mt-1"
                />
            </td>
            <td>
                {isGroup ? (
                    <ul className="space-y-2">
                        {form.data.items.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center gap-2"
                            >
                                <span className="min-w-[110px] text-[#4b3b4b]">
                                    {item.product_name}
                                </span>
                                <TextInput
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        setItemQuantity(item.id, e.target.value)
                                    }
                                    className="block w-16"
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <TextInput
                        type="number"
                        min="1"
                        value={form.data.quantity}
                        onChange={(e) =>
                            form.setData("quantity", e.target.value)
                        }
                        className="block w-20"
                    />
                )}
                <InputError
                    message={form.errors.items ?? form.errors.quantity}
                    className="mt-1"
                />
            </td>
            <td>{liveQuantity}</td>
            <td className="font-semibold text-[#241b2a]">{money(liveTotal)}</td>
            <td>
                <SaleStatusCell
                    paid={savedTotal > 0 && savedPaid >= savedTotal}
                    paymentMethod={first.payment_method}
                    total={savedTotal}
                    amountPaid={savedPaid}
                    onMarkPending={markPending}
                    onAbono={abonar}
                />
            </td>
            <td>
                <DeliveryStatusCell
                    delivered={first.delivered}
                    onToggle={toggleDelivered}
                />
            </td>
            <td className="text-[#6e6774]">{first.sold_by}</td>
            <td className="text-right">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={submit}
                        disabled={form.processing}
                        className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                    >
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="text-sm font-medium text-[#6e6774] hover:text-[#241b2a]"
                    >
                        Cancelar
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SaleStatusCell({ paid, paymentMethod, total, amountPaid, onMarkPending, onAbono }) {
    const [open, setOpen] = useState(false);

    if (paid) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <span className="status-pill bg-[#fce6ee] text-[#b93d69]">
                    Pagó · {paymentMethod}
                </span>
                <button
                    onClick={onMarkPending}
                    className="text-[11px] font-medium text-[#8a7d88] hover:text-[#241b2a]"
                >
                    Deshacer
                </button>
            </div>
        );
    }

    const pending = Math.max(total - amountPaid, 0);

    if (open) {
        return (
            <AbonoForm
                pending={pending}
                onSubmit={(amount, method) => {
                    onAbono(amount, method);
                    setOpen(false);
                }}
                onCancel={() => setOpen(false)}
            />
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill bg-[#fff1d6] text-[#a66a1d]">
                {amountPaid > 0
                    ? `Abonó ${money(amountPaid)} · Debe ${money(pending)}`
                    : `Debe ${money(pending)}`}
            </span>
            <button
                onClick={() => setOpen(true)}
                className="text-[11px] font-medium text-[#d94a7d] hover:text-[#b93d69]"
            >
                Abonar
            </button>
        </div>
    );
}

// Opens inline in place of the status pill so registering a payment never
// grows the row beyond one compact line — prefilled with the full pending
// amount, so confirming as-is doubles as "mark fully paid".
function AbonoForm({ pending, onSubmit, onCancel }) {
    const [amount, setAmount] = useState(String(pending));
    const [method, setMethod] = useState("");

    const submit = (e) => {
        e.preventDefault();
        const value = Math.min(Math.max(Number(amount) || 0, 0), pending);
        if (value <= 0 || !method) return;
        onSubmit(value, method);
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-1.5">
            <input
                type="number"
                min="0.01"
                step="0.01"
                max={pending}
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="field-input w-[84px] py-1 text-[11px]"
            />
            <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="field-input py-1 text-[11px]"
            >
                <option value="">Método...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
            </select>
            <button
                type="submit"
                disabled={!amount || !method}
                title="Confirmar abono"
                className="rounded-md px-1.5 py-1 text-[13px] font-bold leading-none text-[#1d8d67] hover:bg-[#dff7ee] disabled:opacity-30"
            >
                ✓
            </button>
            <button
                type="button"
                onClick={onCancel}
                title="Cancelar"
                className="rounded-md px-1.5 py-1 text-[13px] font-bold leading-none text-[#8a7d88] hover:bg-[#f3edf2]"
            >
                ×
            </button>
        </form>
    );
}

function DeliveryStatusCell({ delivered, onToggle }) {
    if (delivered) {
        return (
            <button
                onClick={() => onToggle(false)}
                className="status-pill bg-[#dff7ee] text-[#1d8d67] transition hover:bg-[#d1f1e1]"
            >
                Entregado
            </button>
        );
    }

    return (
        <button
            onClick={() => onToggle(true)}
            className="status-pill bg-[#f3edf2] text-[#6e6774] transition hover:bg-[#efe3eb]"
        >
            Pendiente
        </button>
    );
}

function ExpensesSection({ event, eventProducts, expenses }) {
    const form = useForm({
        event_product_id: "",
        category: "",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().slice(0, 10),
    });

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            event_product_id: data.event_product_id || null,
        }));
        form.post(route("expenses.store", event.id), {
            preserveScroll: true,
            onSuccess: () => form.reset("category", "description", "amount"),
        });
    };

    const destroy = (expense) => {
        if (confirm(`¿Eliminar el gasto "${expense.description}"?`)) {
            router.delete(route("expenses.destroy", expense.id), {
                preserveScroll: true,
            });
        }
    };

    const [editingId, setEditingId] = useState(null);

    const generalExpenses = expenses.filter(
        (expense) => !expense.event_product_id,
    );

    return (
        <section className="app-panel overflow-hidden">
            <div className="section-head">
                <h3 className="text-lg font-semibold text-[#241b2a]">Gastos</h3>
            </div>

            <div className="p-5 sm:p-6">
                <form
                    onSubmit={submit}
                    className="mb-6 flex flex-wrap items-end gap-4 rounded-[20px] border border-[#f2dce7] bg-[#fffafc] p-4 sm:p-5"
                >
                    <div className="min-w-[200px]">
                        <InputLabel
                            htmlFor="event_product_id"
                            value="Producto"
                        />
                        <select
                            id="event_product_id"
                            value={form.data.event_product_id}
                            onChange={(e) =>
                                form.setData("event_product_id", e.target.value)
                            }
                            className="field-input mt-2 block w-full"
                        >
                            <option value="">
                                General (todos los productos)
                            </option>
                            {eventProducts.map((ep) => (
                                <option key={ep.id} value={ep.id}>
                                    {ep.product.name}
                                </option>
                            ))}
                        </select>
                        <InputError
                            message={form.errors.event_product_id}
                            className="mt-1"
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <InputLabel htmlFor="category" value="Categoría" />
                        <TextInput
                            id="category"
                            placeholder="Ingredientes, empaques..."
                            value={form.data.category}
                            onChange={(e) =>
                                form.setData("category", e.target.value)
                            }
                            className="mt-2 block w-full"
                        />
                        <InputError
                            message={form.errors.category}
                            className="mt-1"
                        />
                    </div>
                    <div className="min-w-[220px] flex-1">
                        <InputLabel htmlFor="description" value="Descripción" />
                        <TextInput
                            id="description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData("description", e.target.value)
                            }
                            className="mt-2 block w-full"
                        />
                        <InputError
                            message={form.errors.description}
                            className="mt-1"
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <InputLabel htmlFor="amount" value="Monto" />
                        <TextInput
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.amount}
                            onChange={(e) =>
                                form.setData("amount", e.target.value)
                            }
                            className="mt-2 block w-full"
                        />
                        <InputError
                            message={form.errors.amount}
                            className="mt-1"
                        />
                    </div>
                    <div className="min-w-[170px]">
                        <InputLabel htmlFor="expense_date" value="Fecha" />
                        <TextInput
                            id="expense_date"
                            type="date"
                            value={form.data.expense_date}
                            onChange={(e) =>
                                form.setData("expense_date", e.target.value)
                            }
                            className="mt-2 block w-full"
                        />
                    </div>
                    <div className="pt-6">
                        <PrimaryButton disabled={form.processing}>
                            Registrar gasto
                        </PrimaryButton>
                    </div>
                </form>

                <ExpensesTable
                    title="Gastos generales"
                    expenses={generalExpenses}
                    editingId={editingId}
                    onEdit={setEditingId}
                    onCancelEdit={() => setEditingId(null)}
                    onDestroy={destroy}
                />

                {eventProducts.map((ep) => {
                    const productExpenses = expenses.filter(
                        (expense) => expense.event_product_id === ep.id,
                    );

                    if (productExpenses.length === 0) {
                        return null;
                    }

                    return (
                        <ExpensesTable
                            key={ep.id}
                            title={`Gastos de ${ep.product.name}`}
                            expenses={productExpenses}
                            editingId={editingId}
                            onEdit={setEditingId}
                            onCancelEdit={() => setEditingId(null)}
                            onDestroy={destroy}
                        />
                    );
                })}
            </div>
        </section>
    );
}

function ExpensesTable({
    title,
    expenses,
    editingId,
    onEdit,
    onCancelEdit,
    onDestroy,
}) {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="mb-6 overflow-hidden rounded-[20px] border border-[#f2dce7] bg-white last:mb-0">
            <div className="flex items-center justify-between border-b border-[#f4dfe8] bg-[#fffafc] px-4 py-3 sm:px-5">
                <h4 className="text-sm font-semibold text-[#241b2a]">
                    {title}
                </h4>
                <span className="text-sm font-semibold text-[#b93d69]">
                    {money(total)}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="data-table min-w-[840px]">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                            <th>Registrado por</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <ExpenseRow
                                key={expense.id}
                                expense={expense}
                                editing={editingId === expense.id}
                                onEdit={() => onEdit(expense.id)}
                                onCancelEdit={onCancelEdit}
                                onDestroy={() => onDestroy(expense)}
                            />
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-5 text-center text-[#6e6774]"
                                >
                                    Sin gastos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ExpenseRow({ expense, editing, onEdit, onCancelEdit, onDestroy }) {
    const form = useForm({
        event_product_id: expense.event_product_id ?? "",
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date,
    });

    if (!editing) {
        return (
            <tr>
                <td className="font-medium text-[#4b3b4b]">
                    {expense.category}
                </td>
                <td className="font-semibold text-[#241b2a]">
                    {expense.description}
                </td>
                <td className="font-semibold text-[#241b2a]">
                    {money(expense.amount)}
                </td>
                <td className="text-[#6e6774]">{expense.expense_date}</td>
                <td className="text-[#6e6774]">{expense.registered_by}</td>
                <td className="text-right">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onEdit}
                            className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                        >
                            Editar
                        </button>
                        <button
                            onClick={onDestroy}
                            className="text-sm font-medium text-[#d85c68] hover:text-[#b6404a]"
                        >
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            event_product_id: data.event_product_id || null,
        }));
        form.put(route("expenses.update", expense.id), {
            preserveScroll: true,
            onSuccess: onCancelEdit,
        });
    };

    return (
        <tr className="bg-[#fff7fb]">
            <td>
                <TextInput
                    value={form.data.category}
                    onChange={(e) => form.setData("category", e.target.value)}
                    className="block w-28"
                />
                <InputError message={form.errors.category} className="mt-1" />
            </td>
            <td>
                <TextInput
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData("description", e.target.value)
                    }
                    className="block w-full"
                />
                <InputError
                    message={form.errors.description}
                    className="mt-1"
                />
            </td>
            <td>
                <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.data.amount}
                    onChange={(e) => form.setData("amount", e.target.value)}
                    className="block w-24"
                />
                <InputError message={form.errors.amount} className="mt-1" />
            </td>
            <td>
                <TextInput
                    type="date"
                    value={form.data.expense_date}
                    onChange={(e) =>
                        form.setData("expense_date", e.target.value)
                    }
                    className="block w-36"
                />
                <InputError
                    message={form.errors.expense_date}
                    className="mt-1"
                />
            </td>
            <td className="text-[#6e6774]">{expense.registered_by}</td>
            <td className="text-right">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={submit}
                        disabled={form.processing}
                        className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                    >
                        Guardar
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="text-sm font-medium text-[#6e6774] hover:text-[#241b2a]"
                    >
                        Cancelar
                    </button>
                </div>
            </td>
        </tr>
    );
}
