import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

const money = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const statusStyles = {
    planificado: 'bg-gray-100 text-gray-700',
    activo: 'bg-rose-100 text-rose-700',
    cerrado: 'bg-red-100 text-red-700',
};

export default function Index({ events }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        event_date: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('events.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Eventos
                </h2>
            }
        >
            <Head title="Eventos" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            Nuevo evento
                        </h3>
                        <form onSubmit={submit} className="flex flex-wrap items-start gap-4">
                            <div>
                                <InputLabel htmlFor="name" value="Nombre del evento" />
                                <TextInput
                                    id="name"
                                    placeholder="Ej. Sábado - Postres"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-64"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="event_date" value="Fecha" />
                                <TextInput
                                    id="event_date"
                                    type="date"
                                    value={data.event_date}
                                    onChange={(e) => setData('event_date', e.target.value)}
                                    className="mt-1 block w-48"
                                />
                                <InputError message={errors.event_date} className="mt-1" />
                            </div>
                            <div className="flex-1">
                                <InputLabel htmlFor="notes" value="Notas (opcional)" />
                                <TextInput
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                            <div className="pt-6">
                                <PrimaryButton disabled={processing}>Crear evento</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {events.map((event) => (
                            <Link
                                key={event.id}
                                href={route('events.show', event.id)}
                                className="block rounded-lg border border-transparent bg-white p-5 shadow transition hover:border-rose-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {event.name}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CO', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusStyles[event.status]}`}
                                    >
                                        {event.status}
                                    </span>
                                </div>
                                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                                    <div>
                                        <dt className="text-gray-500">Ingresos</dt>
                                        <dd className="font-medium text-gray-900">{money(event.income)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Por cobrar</dt>
                                        <dd
                                            className={`font-medium ${event.pending > 0 ? 'text-amber-600' : 'text-gray-900'}`}
                                        >
                                            {money(event.pending)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Gastos</dt>
                                        <dd className="font-medium text-gray-900">{money(event.expenses)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Ganancia</dt>
                                        <dd
                                            className={`font-medium ${event.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                            {money(event.profit)}
                                        </dd>
                                    </div>
                                </dl>
                            </Link>
                        ))}
                        {events.length === 0 && (
                            <p className="text-gray-500">Todavía no has creado ningún evento.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
