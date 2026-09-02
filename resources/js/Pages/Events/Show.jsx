import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const money = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export default function Show({ event, eventProducts, sales, expenses, summary, availableProducts }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {event.name}
                    </h2>
                    <StatusSelect event={event} />
                </div>
            }
        >
            <Head title={event.name} />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-8 sm:px-6 lg:px-8">
                    <SummaryCards summary={summary} />
                    <EventProductsSection
                        event={event}
                        eventProducts={eventProducts}
                        availableProducts={availableProducts}
                    />
                    <SalesSection event={event} eventProducts={eventProducts} sales={sales} />
                    <ExpensesSection event={event} eventProducts={eventProducts} expenses={expenses} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatusSelect({ event }) {
    const handleChange = (e) => {
        router.put(
            route('events.update', event.id),
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
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500"
        >
            <option value="planificado">Planificado</option>
            <option value="activo">Activo</option>
            <option value="cerrado">Cerrado</option>
        </select>
    );
}

function SummaryCards({ summary }) {
    const cards = [
        { label: 'Ingresos (pagado)', value: summary.income, tone: 'text-gray-900' },
        { label: 'Por cobrar', value: summary.pending, tone: summary.pending > 0 ? 'text-amber-600' : 'text-gray-900' },
        { label: 'Gastos', value: summary.expenses, tone: 'text-gray-900' },
        {
            label: 'Ganancia',
            value: summary.profit,
            tone: summary.profit >= 0 ? 'text-green-600' : 'text-red-600',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map((card) => (
                <div key={card.label} className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${card.tone}`}>{money(card.value)}</p>
                </div>
            ))}
        </div>
    );
}

function EventProductsSection({ event, eventProducts, availableProducts }) {
    const addForm = useForm({
        product_id: availableProducts[0]?.id ?? '',
        quantity_made: '',
        unit_price: '',
    });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('event-products.store', event.id), {
            preserveScroll: true,
            onSuccess: () => addForm.reset('quantity_made', 'unit_price'),
        });
    };

    const removeProduct = (eventProduct) => {
        if (confirm(`¿Quitar "${eventProduct.product.name}" de este evento?`)) {
            router.delete(route('event-products.destroy', eventProduct.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <section className="rounded-lg bg-white p-5 shadow sm:p-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Productos del evento</h3>

            <table className="mb-6 w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                    <tr>
                        <th className="py-2 pr-2">Producto</th>
                        <th className="py-2 pr-2">Hecho</th>
                        <th className="py-2 pr-2">Vendido</th>
                        <th className="py-2 pr-2">Disponible</th>
                        <th className="py-2 pr-2">Precio</th>
                        <th className="py-2 pr-2">Costo/u</th>
                        <th className="py-2 pr-2">Ganancia/u</th>
                        <th className="py-2 pr-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {eventProducts.map((ep) => (
                        <tr key={ep.id} className="border-b transition-colors last:border-0 hover:bg-rose-50/50">
                            <td className="py-2 pr-2 font-medium text-gray-900">{ep.product.name}</td>
                            <td className="py-2 pr-2">{ep.quantity_made}</td>
                            <td className="py-2 pr-2">{ep.quantity_sold}</td>
                            <td className="py-2 pr-2">
                                <span
                                    className={ep.quantity_available <= 0 ? 'font-semibold text-red-600' : ''}
                                >
                                    {ep.quantity_available}
                                </span>
                            </td>
                            <td className="py-2 pr-2">{money(ep.unit_price)}</td>
                            <td className="py-2 pr-2 text-gray-500">{money(ep.cost_per_unit)}</td>
                            <td className="py-2 pr-2">
                                <span className={ep.profit_per_unit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {money(ep.profit_per_unit)}
                                </span>
                            </td>
                            <td className="py-2 pr-2 text-right">
                                <button
                                    onClick={() => removeProduct(ep)}
                                    className="text-red-600 hover:underline"
                                >
                                    Quitar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {eventProducts.length === 0 && (
                        <tr>
                            <td colSpan={8} className="py-4 text-center text-gray-500">
                                Todavía no has agregado productos a este evento.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {availableProducts.length > 0 ? (
                <form onSubmit={submitAdd} className="flex flex-wrap items-start gap-4">
                    <div>
                        <InputLabel htmlFor="product_id" value="Producto" />
                        <select
                            id="product_id"
                            value={addForm.data.product_id}
                            onChange={(e) => addForm.setData('product_id', e.target.value)}
                            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                        >
                            {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={addForm.errors.product_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="quantity_made" value="Cantidad hecha" />
                        <TextInput
                            id="quantity_made"
                            type="number"
                            min="1"
                            value={addForm.data.quantity_made}
                            onChange={(e) => addForm.setData('quantity_made', e.target.value)}
                            className="mt-1 block w-32"
                        />
                        <InputError message={addForm.errors.quantity_made} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="unit_price" value="Precio de venta" />
                        <TextInput
                            id="unit_price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={addForm.data.unit_price}
                            onChange={(e) => addForm.setData('unit_price', e.target.value)}
                            className="mt-1 block w-32"
                        />
                        <InputError message={addForm.errors.unit_price} className="mt-1" />
                    </div>
                    <div className="pt-6">
                        <PrimaryButton disabled={addForm.processing}>Agregar</PrimaryButton>
                    </div>
                </form>
            ) : (
                <p className="text-sm text-gray-500">
                    Primero crea productos en el catálogo para poder agregarlos aquí.
                </p>
            )}
        </section>
    );
}

function SalesSection({ event, eventProducts, sales }) {
    const sellable = eventProducts.filter((ep) => ep.quantity_available > 0);

    const [customerName, setCustomerName] = useState('');
    const [cart, setCart] = useState([]); // [{ event_product_id, product_name, unit_price, quantity }]
    const [pickProductId, setPickProductId] = useState(sellable[0]?.id ?? '');
    const [pickQuantity, setPickQuantity] = useState(1);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const sellableIds = sellable.map((ep) => ep.id).join(',');
    useEffect(() => {
        if (sellable.length > 0 && !sellable.some((ep) => ep.id === pickProductId)) {
            setPickProductId(sellable[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellableIds]);

    const inCart = (eventProductId) => cart.find((item) => item.event_product_id === eventProductId);

    const remainingFor = (ep) => ep.quantity_available - (inCart(ep.id)?.quantity ?? 0);

    const pickableProducts = sellable.filter((ep) => remainingFor(ep) > 0);
    const pickedProduct = pickableProducts.find((ep) => ep.id === pickProductId);
    const pickMax = pickedProduct ? remainingFor(pickedProduct) : 0;

    useEffect(() => {
        if (pickableProducts.length > 0 && !pickableProducts.some((ep) => ep.id === pickProductId)) {
            setPickProductId(pickableProducts[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, sellableIds]);

    const addToCart = (e) => {
        e.preventDefault();
        if (!pickedProduct) return;

        const quantity = Math.min(Math.max(1, Number(pickQuantity) || 1), pickMax);

        setCart((current) => {
            const existing = current.find((item) => item.event_product_id === pickedProduct.id);
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
        setCart((current) => current.filter((item) => item.event_product_id !== eventProductId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.post(
            route('sales.store', event.id),
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
                    setCustomerName('');
                    setCart([]);
                },
                onError: (e) => setErrors(e),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <section className="rounded-lg bg-white p-5 shadow sm:p-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Ventas</h3>

            {sellable.length > 0 ? (
                <div className="mb-6 space-y-4 rounded-lg border border-gray-200 p-4">
                    <div>
                        <InputLabel htmlFor="customer_name" value="Cliente" />
                        <TextInput
                            id="customer_name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="mt-1 block w-64"
                            placeholder="Nombre del cliente"
                        />
                        <InputError message={errors.customer_name} className="mt-1" />
                    </div>

                    {pickableProducts.length > 0 && (
                        <form onSubmit={addToCart} className="flex flex-wrap items-start gap-4">
                            <div>
                                <InputLabel htmlFor="pick_product" value="Producto" />
                                <select
                                    id="pick_product"
                                    value={pickProductId}
                                    onChange={(e) => setPickProductId(Number(e.target.value))}
                                    className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                >
                                    {pickableProducts.map((ep) => (
                                        <option key={ep.id} value={ep.id}>
                                            {ep.product.name} ({remainingFor(ep)} disp.)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="pick_quantity" value="Cantidad" />
                                <TextInput
                                    id="pick_quantity"
                                    type="number"
                                    min="1"
                                    max={pickMax}
                                    value={pickQuantity}
                                    onChange={(e) => setPickQuantity(e.target.value)}
                                    className="mt-1 block w-24"
                                />
                            </div>
                            <div className="pt-6">
                                <SecondaryButton type="submit">+ Agregar al pedido</SecondaryButton>
                            </div>
                        </form>
                    )}

                    {cart.length > 0 && (
                        <div className="space-y-2">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="py-1.5 pr-2">Producto</th>
                                        <th className="py-1.5 pr-2">Cant.</th>
                                        <th className="py-1.5 pr-2">Subtotal</th>
                                        <th className="py-1.5 pr-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.event_product_id} className="border-b last:border-0">
                                            <td className="py-1.5 pr-2 font-medium text-gray-900">
                                                {item.product_name}
                                            </td>
                                            <td className="py-1.5 pr-2">{item.quantity}</td>
                                            <td className="py-1.5 pr-2">{money(item.unit_price * item.quantity)}</td>
                                            <td className="py-1.5 pr-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.event_product_id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-sm font-medium text-gray-700">
                                    Total: {money(cartTotal)}
                                </span>
                            </div>
                        </div>
                    )}

                    <InputError message={errors.items} />

                    <div>
                        <PrimaryButton
                            onClick={submit}
                            disabled={processing || cart.length === 0 || !customerName.trim()}
                        >
                            Registrar venta{cart.length > 1 ? ` (${cart.length} productos)` : ''}
                        </PrimaryButton>
                    </div>
                </div>
            ) : (
                <p className="mb-6 text-sm text-gray-500">
                    No hay stock disponible para vender. Agrega productos al evento primero.
                </p>
            )}

            <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                    <tr>
                        <th className="py-2 pr-2">Cliente</th>
                        <th className="py-2 pr-2">Producto</th>
                        <th className="py-2 pr-2">Cant.</th>
                        <th className="py-2 pr-2">Total</th>
                        <th className="py-2 pr-2">Estado</th>
                        <th className="py-2 pr-2">Vendido por</th>
                        <th className="py-2 pr-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {groupSales(sales).map((group) => (
                        <SaleGroupRow key={group[0].group_id ?? `single-${group[0].id}`} group={group} />
                    ))}
                    {sales.length === 0 && (
                        <tr>
                            <td colSpan={7} className="py-4 text-center text-gray-500">
                                Todavía no hay ventas registradas.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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

function SaleGroupRow({ group }) {
    const first = group[0];
    const isGroup = group.length > 1;
    const totalQuantity = group.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalAmount = group.reduce((sum, sale) => sum + sale.total, 0);

    const updateRoute = () =>
        isGroup ? route('sales.group.update', first.group_id) : route('sales.update', first.id);
    const destroyRoute = () =>
        isGroup ? route('sales.group.destroy', first.group_id) : route('sales.destroy', first.id);

    const markPaid = (method) => {
        if (!method) return;
        router.put(updateRoute(), { paid: true, payment_method: method }, { preserveScroll: true });
    };

    const markPending = () => {
        router.put(updateRoute(), { paid: false, payment_method: null }, { preserveScroll: true });
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
        <tr className="border-b align-top transition-colors last:border-0 hover:bg-rose-50/50">
            <td className="py-2 pr-2 font-medium text-gray-900">{first.customer_name}</td>
            <td className="py-2 pr-2">
                {isGroup ? (
                    <ul className="space-y-0.5">
                        {group.map((sale) => (
                            <li key={sale.id}>
                                {sale.product_name} <span className="text-gray-400">x{sale.quantity}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    first.product_name
                )}
            </td>
            <td className="py-2 pr-2">{totalQuantity}</td>
            <td className="py-2 pr-2">{money(totalAmount)}</td>
            <td className="py-2 pr-2">
                <SaleStatusCell paid={first.paid} paymentMethod={first.payment_method} onMarkPaid={markPaid} onMarkPending={markPending} />
            </td>
            <td className="py-2 pr-2 text-gray-500">{first.sold_by}</td>
            <td className="py-2 pr-2 text-right">
                <button onClick={cancel} className="text-red-600 hover:underline">
                    Anular
                </button>
            </td>
        </tr>
    );
}

function SaleStatusCell({ paid, paymentMethod, onMarkPaid, onMarkPending }) {
    if (paid) {
        return (
            <div className="flex items-center gap-2">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    Pagó · {paymentMethod}
                </span>
                <button onClick={onMarkPending} className="text-xs text-gray-400 hover:underline">
                    Deshacer
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Debe
            </span>
            <select
                value=""
                onChange={(e) => onMarkPaid(e.target.value)}
                className="rounded-md border-gray-300 py-0.5 text-xs shadow-sm focus:border-rose-500 focus:ring-rose-500"
            >
                <option value="">Marcar pagado...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
            </select>
        </div>
    );
}

function ExpensesSection({ event, eventProducts, expenses }) {
    const form = useForm({
        event_product_id: '',
        category: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
    });

    const submit = (e) => {
        e.preventDefault();
        form
            .transform((data) => ({
                ...data,
                event_product_id: data.event_product_id || null,
            }))
            .post(route('expenses.store', event.id), {
                preserveScroll: true,
                onSuccess: () => form.reset('category', 'description', 'amount'),
            });
    };

    const destroy = (expense) => {
        if (confirm(`¿Eliminar el gasto "${expense.description}"?`)) {
            router.delete(route('expenses.destroy', expense.id), { preserveScroll: true });
        }
    };

    const generalExpenses = expenses.filter((expense) => !expense.event_product_id);

    return (
        <section className="rounded-lg bg-white p-5 shadow sm:p-8">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Gastos</h3>

            <form onSubmit={submit} className="mb-6 flex flex-wrap items-start gap-4">
                <div>
                    <InputLabel htmlFor="event_product_id" value="Producto" />
                    <select
                        id="event_product_id"
                        value={form.data.event_product_id}
                        onChange={(e) => form.setData('event_product_id', e.target.value)}
                        className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                    >
                        <option value="">General (todos los productos)</option>
                        {eventProducts.map((ep) => (
                            <option key={ep.id} value={ep.id}>
                                {ep.product.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={form.errors.event_product_id} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="category" value="Categoría" />
                    <TextInput
                        id="category"
                        placeholder="Ingredientes, empaques..."
                        value={form.data.category}
                        onChange={(e) => form.setData('category', e.target.value)}
                        className="mt-1 block w-40"
                    />
                    <InputError message={form.errors.category} className="mt-1" />
                </div>
                <div className="flex-1">
                    <InputLabel htmlFor="description" value="Descripción" />
                    <TextInput
                        id="description"
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    <InputError message={form.errors.description} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="amount" value="Monto" />
                    <TextInput
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                        className="mt-1 block w-32"
                    />
                    <InputError message={form.errors.amount} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="expense_date" value="Fecha" />
                    <TextInput
                        id="expense_date"
                        type="date"
                        value={form.data.expense_date}
                        onChange={(e) => form.setData('expense_date', e.target.value)}
                        className="mt-1 block w-40"
                    />
                </div>
                <div className="pt-6">
                    <PrimaryButton disabled={form.processing}>Registrar gasto</PrimaryButton>
                </div>
            </form>

            <ExpensesTable title="Gastos generales" expenses={generalExpenses} onDestroy={destroy} />

            {eventProducts.map((ep) => {
                const productExpenses = expenses.filter((expense) => expense.event_product_id === ep.id);

                if (productExpenses.length === 0) {
                    return null;
                }

                return (
                    <ExpensesTable
                        key={ep.id}
                        title={`Gastos de ${ep.product.name}`}
                        expenses={productExpenses}
                        onDestroy={destroy}
                    />
                );
            })}
        </section>
    );
}

function ExpensesTable({ title, expenses, onDestroy }) {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="mb-6 last:mb-0">
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
                <span className="text-sm text-gray-500">{money(total)}</span>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-gray-500">
                    <tr>
                        <th className="py-2 pr-2">Categoría</th>
                        <th className="py-2 pr-2">Descripción</th>
                        <th className="py-2 pr-2">Monto</th>
                        <th className="py-2 pr-2">Fecha</th>
                        <th className="py-2 pr-2">Registrado por</th>
                        <th className="py-2 pr-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b transition-colors last:border-0 hover:bg-rose-50/50">
                            <td className="py-2 pr-2">{expense.category}</td>
                            <td className="py-2 pr-2 font-medium text-gray-900">{expense.description}</td>
                            <td className="py-2 pr-2">{money(expense.amount)}</td>
                            <td className="py-2 pr-2">{expense.expense_date}</td>
                            <td className="py-2 pr-2 text-gray-500">{expense.registered_by}</td>
                            <td className="py-2 pr-2 text-right">
                                <button
                                    onClick={() => onDestroy(expense)}
                                    className="text-red-600 hover:underline"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-3 text-center text-gray-400">
                                Sin gastos registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
