import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
} from 'recharts';

const money = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const compactMoney = (value) => {
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`;
    return `${sign}$${abs}`;
};

const pad = (n) => String(n).padStart(2, '0');
const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function computePresets() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    return {
        thisMonth: {
            label: 'Este mes',
            from: toISODate(new Date(y, m, 1)),
            to: toISODate(new Date(y, m + 1, 0)),
        },
        lastMonth: {
            label: 'Mes pasado',
            from: toISODate(new Date(y, m - 1, 1)),
            to: toISODate(new Date(y, m, 0)),
        },
        thisYear: {
            label: 'Este año',
            from: toISODate(new Date(y, 0, 1)),
            to: toISODate(new Date(y, 11, 31)),
        },
        lastYear: {
            label: 'Año pasado',
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
                <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                    <span
                        className="inline-block h-0.5 w-3"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-semibold text-gray-900">{formatter(entry.value)}</span>
                    <span className="text-gray-500">{entry.name}</span>
                </div>
            ))}
        </div>
    );
}

export default function Index({ filters, summary, months, events }) {
    const presets = computePresets();

    const applyRange = (from, to) => {
        router.get(
            route('reports.index'),
            { from, to },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const isActivePreset = (preset) => preset.from === filters.from && preset.to === filters.to;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Finanzas
                </h2>
            }
        >
            <Head title="Finanzas" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">
                    {/* Date range filter — scopes everything below it */}
                    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
                        <div className="flex flex-wrap gap-2">
                            {Object.values(presets).map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyRange(preset.from, preset.to)}
                                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                        isActivePreset(preset)
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="ms-auto flex items-end gap-2 border-l border-gray-200 pl-3">
                            <div>
                                <label className="block text-xs text-gray-500">Desde</label>
                                <input
                                    type="date"
                                    value={filters.from}
                                    onChange={(e) => applyRange(e.target.value, filters.to)}
                                    className="rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500">Hasta</label>
                                <input
                                    type="date"
                                    value={filters.to}
                                    onChange={(e) => applyRange(filters.from, e.target.value)}
                                    className="rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                    </div>

                    <SummaryCards summary={summary} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChartCard title="Ganancia por mes">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        axisLine={{ stroke: '#c3c2b7' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        tickFormatter={compactMoney}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Bar dataKey="profit" name="Ganancia" shape={DivergingBar} maxBarSize={28}>
                                        {months.map((m) => (
                                            <Cell
                                                key={m.month}
                                                fill={m.profit >= 0 ? '#2563eb' : '#dc2626'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Unidades vendidas por mes">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        axisLine={{ stroke: '#c3c2b7' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip formatter={(v) => `${v} unidades`} />}
                                        cursor={{ fill: '#f3f4f6' }}
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

                        <ChartCard title="Ingresos vs. gastos por mes" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        axisLine={{ stroke: '#c3c2b7' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#898781', fontSize: 12 }}
                                        tickFormatter={compactMoney}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3f4f6' }} />
                                    <Legend
                                        iconType="square"
                                        wrapperStyle={{ fontSize: 13, color: '#52514e' }}
                                    />
                                    <Bar dataKey="income" name="Ingresos" fill="#e11d48" shape={RoundedBar} maxBarSize={20} />
                                    <Bar dataKey="expenses" name="Gastos" fill="#2563eb" shape={RoundedBar} maxBarSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <EventsTable events={events} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCards({ summary }) {
    const cards = [
        { label: 'Ingresos', value: money(summary.income), tone: 'text-gray-900' },
        {
            label: 'Por cobrar',
            value: money(summary.pending),
            tone: summary.pending > 0 ? 'text-amber-600' : 'text-gray-900',
        },
        { label: 'Gastos', value: money(summary.expenses), tone: 'text-gray-900' },
        {
            label: 'Ganancia',
            value: money(summary.profit),
            tone: summary.profit >= 0 ? 'text-green-600' : 'text-red-600',
        },
        { label: 'Unidades vendidas', value: summary.quantitySold, tone: 'text-gray-900' },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {cards.map((card) => (
                <div key={card.label} className="rounded-lg bg-white p-5 shadow">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
}

function ChartCard({ title, children, className = '' }) {
    return (
        <div className={`rounded-lg bg-white p-5 shadow sm:p-6 ${className}`}>
            <h3 className="mb-4 text-base font-medium text-gray-900">{title}</h3>
            {children}
        </div>
    );
}

const eventStatusStyles = {
    planificado: 'bg-gray-100 text-gray-700',
    activo: 'bg-rose-100 text-rose-700',
    cerrado: 'bg-red-100 text-red-700',
};

function EventsTable({ events }) {
    return (
        <div className="rounded-lg bg-white shadow">
            <h3 className="px-5 pt-5 text-base font-medium text-gray-900 sm:px-6 sm:pt-6">
                Eventos en el periodo
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase text-gray-500">
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
                            <tr key={event.id} className="border-b transition-colors last:border-0 hover:bg-rose-50/50">
                                <td className="px-5 py-3 font-medium text-gray-900 sm:px-6">
                                    <Link href={route('events.show', event.id)} className="hover:underline">
                                        {event.name}
                                    </Link>
                                </td>
                                <td className="px-5 py-3 text-gray-600 sm:px-6">{event.event_date}</td>
                                <td className="px-5 py-3 sm:px-6">
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${eventStatusStyles[event.status]}`}
                                    >
                                        {event.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 sm:px-6">{money(event.income)}</td>
                                <td className="px-5 py-3 sm:px-6">{money(event.expenses)}</td>
                                <td
                                    className={`px-5 py-3 font-medium sm:px-6 ${event.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {money(event.profit)}
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-6 text-center text-gray-500 sm:px-6">
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
