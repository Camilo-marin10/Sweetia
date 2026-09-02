import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";

const money = (value) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

const statusStyles = {
    planificado: "bg-gray-100 text-gray-700",
    activo: "bg-rose-100 text-rose-700",
    cerrado: "bg-red-100 text-red-700",
};

export default function Index({ events }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        event_date: "",
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("events.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d15d8e]">
                            Operación
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#241b2a]">
                            Eventos
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Eventos" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div className="app-panel-soft p-5 sm:p-7">
                        <h3 className="mb-5 text-lg font-semibold text-[#241b2a]">
                            Nuevo evento
                        </h3>
                        <form
                            onSubmit={submit}
                            className="flex flex-wrap items-end gap-4"
                        >
                            <div className="min-w-[220px] flex-1">
                                <InputLabel
                                    htmlFor="name"
                                    value="Nombre del evento"
                                />
                                <TextInput
                                    id="name"
                                    placeholder="Ej. Sábado - Postres"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="mt-2 block w-full"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <InputLabel
                                    htmlFor="event_date"
                                    value="Fecha"
                                />
                                <TextInput
                                    id="event_date"
                                    type="date"
                                    value={data.event_date}
                                    onChange={(e) =>
                                        setData("event_date", e.target.value)
                                    }
                                    className="mt-2 block w-full"
                                />
                                <InputError
                                    message={errors.event_date}
                                    className="mt-1"
                                />
                            </div>
                            <div className="min-w-[220px] flex-[2]">
                                <InputLabel
                                    htmlFor="notes"
                                    value="Notas (opcional)"
                                />
                                <TextInput
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData("notes", e.target.value)
                                    }
                                    className="mt-2 block w-full"
                                />
                            </div>
                            <div className="pt-6">
                                <PrimaryButton disabled={processing}>
                                    Crear evento
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        {events.map((event) => (
                            <Link
                                key={event.id}
                                href={route("events.show", event.id)}
                                className="group block rounded-[24px] border border-[#f2dce7] bg-white p-5 shadow-[0_20px_40px_rgba(82,44,64,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-[#eabbd0] hover:shadow-[0_24px_45px_rgba(82,44,64,0.12)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-[#241b2a]">
                                            {event.name}
                                        </h4>
                                        <p className="mt-1 text-sm text-[#6e6774]">
                                            {new Date(
                                                event.event_date + "T00:00:00",
                                            ).toLocaleDateString("es-CO", {
                                                weekday: "long",
                                                day: "numeric",
                                                month: "long",
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={`status-pill capitalize ${statusStyles[event.status]}`}
                                    >
                                        {event.status}
                                    </span>
                                </div>
                                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                    <div className="rounded-2xl bg-[#fff7fb] p-3">
                                        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a6876]">
                                            Ingresos
                                        </dt>
                                        <dd className="mt-1 font-semibold text-[#241b2a]">
                                            {money(event.income)}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-[#fff7fb] p-3">
                                        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a6876]">
                                            Por cobrar
                                        </dt>
                                        <dd
                                            className={`mt-1 font-semibold ${event.pending > 0 ? "text-[#d2911d]" : "text-[#241b2a]"}`}
                                        >
                                            {money(event.pending)}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-[#fff7fb] p-3">
                                        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a6876]">
                                            Gastos
                                        </dt>
                                        <dd className="mt-1 font-semibold text-[#241b2a]">
                                            {money(event.expenses)}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-[#fff7fb] p-3">
                                        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a6876]">
                                            Ganancia
                                        </dt>
                                        <dd
                                            className={`mt-1 font-semibold ${event.profit >= 0 ? "text-[#1f9d72]" : "text-[#d85c68]"}`}
                                        >
                                            {money(event.profit)}
                                        </dd>
                                    </div>
                                </dl>
                            </Link>
                        ))}
                        {events.length === 0 && (
                            <p className="text-[#6e6774]">
                                Todavía no has creado ningún evento.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
