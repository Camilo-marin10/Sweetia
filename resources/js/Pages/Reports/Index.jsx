import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const money = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

const compactMoney = (value) => {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value);
    if (abs >= 1000000)
        return `${sign}$${(abs / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs}`;
};

const pad = (n) => String(n).padStart(2, "0");
const toISODate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function computePresets() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    return {
        thisMonth: {
            label: "Este mes",
            from: toISODate(new Date(y, m, 1)),
            to: toISODate(new Date(y, m + 1, 0)),
        },
        lastMonth: {
            label: "Mes pasado",
            from: toISODate(new Date(y, m - 1, 1)),
            to: toISODate(new Date(y, m, 0)),
        },
        thisYear: {
            label: "Este año",
            from: toISODate(new Date(y, 0, 1)),
            to: toISODate(new Date(y, 11, 31)),
        },
        lastYear: {
            label: "Año pasado",
            from: toISODate(new Date(y - 1, 0, 1)),
            to: toISODate(new Date(y - 1, 11, 31)),
        },
    };
}

// Rounds only the outer end of a bar and keeps the baseline edge square —
// growing up for positive values, down for negative ones (diverging charts).
function RoundedBar(props) {
    const { x, y, width, height, fill, dataKey, payload } = props;
    const radius = Math.min(4, width / 2, Math.abs(height));
    const rawValue = payload?.[dataKey];
    const negative = props.allowNegative && rawValue < 0;

    if (!height) return null;

    const d = negative
        ? `M${x},${y}
           L${x + width},${y}
           L${x + width},${y + height - radius}
           Q${x + width},${y + height} ${x + width - radius},${y + height}
           L${x + radius},${y + height}
           Q${x},${y + height} ${x},${y + height - radius}
           Z`
        : `M${x},${y + radius}
           Q${x},${y} ${x + radius},${y}
           L${x + width - radius},${y}
           Q${x + width},${y} ${x + width},${y + radius}
           L${x + width},${y + height}
           L${x},${y + height}
           Z`;

    return <path d={d} fill={fill} />;
}

function DivergingBar(props) {
    return <RoundedBar {...props} allowNegative />;
}

function ChartTooltip({ active, payload, label, formatter = money }) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
            <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
            {payload.map((entry) => (
                <div
                    key={entry.dataKey}
                    className="flex items-center gap-2 text-sm"
                >
                    <span
                        className="inline-block h-0.5 w-3"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-semibold text-gray-900">
                        {formatter(entry.value)}
                    </span>
                    <span className="text-gray-500">{entry.name}</span>
                </div>
            ))}
        </div>
    );
}

export default function Index({
    filters,
    summary,
    months,
    events,
    expensesByProduct,
}) {
    const presets = computePresets();

    const applyRange = (from, to) => {
        router.get(
            route("reports.index"),
            { from, to },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const isActivePreset = (preset) =>
        preset.from === filters.from && preset.to === filters.to;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d15d8e]">
                            Dashboard
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#241b2a]">
                            Finanzas
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Finanzas" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Date range filter — scopes everything below it */}
                    <div className="app-panel-soft flex flex-wrap items-end gap-4 p-4 sm:p-5">
                        <div className="flex flex-wrap gap-2">
                            {Object.values(presets).map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() =>
                                        applyRange(preset.from, preset.to)
                                    }
                                    className={`toolbar-button ${
                                        isActivePreset(preset)
                                            ? "bg-gradient-to-r from-[#d94a7d] to-[#bf3d6e] text-white shadow-[0_16px_30px_rgba(190,77,120,0.25)]"
                                            : "border border-[#f2dce7] bg-[#fffafc] text-[#4b3b4b] hover:bg-[#fff2f8]"
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="ms-auto flex items-end gap-3 border-l border-[#f0dbe5] pl-4">
                            <div>
                                <label className="soft-label">Desde</label>
                                <input
                                    type="date"
                                    value={filters.from}
                                    onChange={(e) =>
                                        applyRange(e.target.value, filters.to)
                                    }
                                    className="field-input w-[160px] py-2.5"
                                />
                            </div>
                            <div>
                                <label className="soft-label">Hasta</label>
                                <input
                                    type="date"
                                    value={filters.to}
                                    onChange={(e) =>
                                        applyRange(filters.from, e.target.value)
                                    }
                                    className="field-input w-[160px] py-2.5"
                                />
                            </div>
                        </div>
                    </div>

                    <SummaryCards summary={summary} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChartCard title="Ganancia por mes">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={months}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        axisLine={{ stroke: "#c3c2b7" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        tickFormatter={compactMoney}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip />}
                                        cursor={{ fill: "#f3f4f6" }}
                                    />
                                    <Bar
                                        dataKey="profit"
                                        name="Ganancia"
                                        shape={DivergingBar}
                                        maxBarSize={28}
                                    >
                                        {months.map((m) => (
                                            <Cell
                                                key={m.month}
                                                fill={
                                                    m.profit >= 0
                                                        ? "#2563eb"
                                                        : "#dc2626"
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Unidades vendidas por mes">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={months}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        axisLine={{ stroke: "#c3c2b7" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={
                                            <ChartTooltip
                                                formatter={(v) =>
                                                    `${v} unidades`
                                                }
                                            />
                                        }
                                        cursor={{ fill: "#f3f4f6" }}
                                    />
                                    <Bar
                                        dataKey="quantity"
                                        name="Unidades"
                                        shape={RoundedBar}
                                        fill="#e11d48"
                                        maxBarSize={28}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            title="Ingresos vs. gastos por mes"
                            className="lg:col-span-2"
                        >
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={months}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        axisLine={{ stroke: "#c3c2b7" }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#898781", fontSize: 12 }}
                                        tickFormatter={compactMoney}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip />}
                                        cursor={{ fill: "#f3f4f6" }}
                                    />
                                    <Legend
                                        iconType="square"
                                        wrapperStyle={{
                                            fontSize: 13,
                                            color: "#52514e",
                                        }}
                                    />
                                    <Bar
                                        dataKey="income"
                                        name="Ingresos"
                                        fill="#e11d48"
                                        shape={RoundedBar}
                                        maxBarSize={20}
                                    />
                                    <Bar
                                        dataKey="expenses"
                                        name="Gastos"
                                        fill="#2563eb"
                                        shape={RoundedBar}
                                        maxBarSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <ExpensesByProductTable
                        expensesByProduct={expensesByProduct}
                        totalExpenses={summary.expenses}
                    />

                    <EventsTable events={events} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCards({ summary }) {
    const cards = [
        {
            label: "Ingresos",
            value: money(summary.income),
            tone: "text-gray-900",
        },
        {
            label: "Por cobrar",
            value: money(summary.pending),
            tone: summary.pending > 0 ? "text-amber-600" : "text-gray-900",
        },
        {
            label: "Gastos",
            value: money(summary.expenses),
            tone: "text-gray-900",
        },
        {
            label: "Ganancia",
            value: money(summary.profit),
            tone: summary.profit >= 0 ? "text-green-600" : "text-red-600",
        },
        {
            label: "Unidades vendidas",
            value: summary.quantitySold,
            tone: "text-gray-900",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {cards.map((card) => (
                <div key={card.label} className="app-panel-soft p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a6876]">
                        {card.label}
                    </p>
                    <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>
                        {card.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ChartCard({ title, children, className = "" }) {
    return (
        <div className={`app-panel p-5 sm:p-6 ${className}`}>
            <h3 className="mb-4 text-lg font-semibold text-[#241b2a]">
                {title}
            </h3>
            {children}
        </div>
    );
}

function ExpensesByProductTable({ expensesByProduct, totalExpenses }) {
    return (
        <div className="app-panel overflow-hidden">
            <div className="border-b border-[#f4dfe8] bg-[#fffafc] px-5 py-4 sm:px-6">
                <h3 className="text-lg font-semibold text-[#241b2a]">
                    Gastos por producto
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 sm:px-6">Producto</th>
                            <th className="px-5 py-3 sm:px-6">Monto</th>
                            <th className="px-5 py-3 sm:px-6">% del total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expensesByProduct.map((row) => {
                            const percent =
                                totalExpenses > 0
                                    ? (row.total / totalExpenses) * 100
                                    : 0;

                            return (
                                <tr key={row.product_id ?? "general"}>
                                    <td className="px-5 py-3 font-semibold text-[#241b2a] sm:px-6">
                                        {row.product_name}
                                    </td>
                                    <td className="px-5 py-3 sm:px-6">
                                        {money(row.total)}
                                    </td>
                                    <td className="px-5 py-3 sm:px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#f5e2eb]">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#d94a7d] to-[#bf3d6e]"
                                                    style={{
                                                        width: `${Math.min(percent, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[#6e6774]">
                                                {percent.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {expensesByProduct.length === 0 && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-5 py-6 text-center text-[#6e6774] sm:px-6"
                                >
                                    No hay gastos en el periodo seleccionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const eventStatusStyles = {
    planificado: "bg-gray-100 text-gray-700",
    activo: "bg-rose-100 text-rose-700",
    cerrado: "bg-red-100 text-red-700",
};

function EventsTable({ events }) {
    return (
        <div className="app-panel overflow-hidden">
            <div className="border-b border-[#f4dfe8] bg-[#fffafc] px-5 py-4 sm:px-6">
                <h3 className="text-lg font-semibold text-[#241b2a]">
                    Eventos en el periodo
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 sm:px-6">Evento</th>
                            <th className="px-5 py-3 sm:px-6">Fecha</th>
                            <th className="px-5 py-3 sm:px-6">Estado</th>
                            <th className="px-5 py-3 sm:px-6">Ingresos</th>
                            <th className="px-5 py-3 sm:px-6">Gastos</th>
                            <th className="px-5 py-3 sm:px-6">Ganancia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event) => (
                            <tr key={event.id}>
                                <td className="px-5 py-3 font-semibold text-[#241b2a] sm:px-6">
                                    <Link
                                        href={route("events.show", event.id)}
                                        className="hover:text-[#b93d69]"
                                    >
                                        {event.name}
                                    </Link>
                                </td>
                                <td className="px-5 py-3 text-[#635867] sm:px-6">
                                    {event.event_date}
                                </td>
                                <td className="px-5 py-3 sm:px-6">
                                    <span
                                        className={`status-pill capitalize ${eventStatusStyles[event.status]}`}
                                    >
                                        {event.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 sm:px-6">
                                    {money(event.income)}
                                </td>
                                <td className="px-5 py-3 sm:px-6">
                                    {money(event.expenses)}
                                </td>
                                <td
                                    className={`px-5 py-3 font-semibold sm:px-6 ${event.profit >= 0 ? "text-[#1f9d72]" : "text-[#d85c68]"}`}
                                >
                                    {money(event.profit)}
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-5 py-6 text-center text-[#6e6774] sm:px-6"
                                >
                                    No hay eventos en el periodo seleccionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
