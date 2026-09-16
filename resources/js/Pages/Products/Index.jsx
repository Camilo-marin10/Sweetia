import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";

export default function Index({ products }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        description: "",
    });

    const [editingId, setEditingId] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route("products.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const destroy = (product) => {
        if (confirm(`¿Eliminar el producto "${product.name}"?`)) {
            router.delete(route("products.destroy", product.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d15d8e]">
                            Catálogo
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#241b2a]">
                            Productos
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Productos" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="app-panel-soft p-5 sm:p-7">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-[#241b2a]">
                                Nuevo producto
                            </h3>
                        </div>
                        <form
                            onSubmit={submit}
                            className="flex flex-wrap items-end gap-4"
                        >
                            <div className="min-w-[220px] flex-1">
                                <InputLabel htmlFor="name" value="Nombre" />
                                <TextInput
                                    id="name"
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
                            <div className="min-w-[260px] flex-[2]">
                                <InputLabel
                                    htmlFor="description"
                                    value="Descripción (opcional)"
                                />
                                <TextInput
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    className="mt-2 block w-full"
                                />
                                <InputError
                                    message={errors.description}
                                    className="mt-1"
                                />
                            </div>
                            <div className="pt-6">
                                <PrimaryButton disabled={processing}>
                                    Agregar
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="app-panel overflow-hidden">
                        <div className="border-b border-[#f4dfe8] bg-[#fffafc] px-5 py-4 sm:px-6">
                            <h3 className="text-lg font-semibold text-[#241b2a]">
                                Catálogo actual
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3">Nombre</th>
                                        <th className="px-5 py-3">
                                            Descripción
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            editing={editingId === product.id}
                                            onEdit={() =>
                                                setEditingId(product.id)
                                            }
                                            onCancelEdit={() =>
                                                setEditingId(null)
                                            }
                                            onDelete={() => destroy(product)}
                                        />
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-5 py-8 text-center text-[#6e6774]"
                                            >
                                                Todavía no hay productos en el
                                                catálogo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ProductRow({ product, editing, onEdit, onCancelEdit, onDelete }) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        description: product.description ?? "",
    });

    if (!editing) {
        return (
            <tr>
                <td
                    data-label="Nombre"
                    className="px-5 py-3 font-semibold text-[#241b2a]"
                >
                    {product.name}
                </td>
                <td data-label="Descripción" className="px-5 py-3 text-[#635867]">
                    {product.description || "—"}
                </td>
                <td data-label="Acciones" className="px-5 py-3 md:text-right">
                    <div className="flex gap-3 md:justify-end">
                        <button
                            onClick={onEdit}
                            className="text-sm font-medium text-[#d94a7d] hover:text-[#b93d69]"
                        >
                            Editar
                        </button>
                        <button
                            onClick={onDelete}
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
        put(route("products.update", product.id), {
            preserveScroll: true,
            onSuccess: onCancelEdit,
        });
    };

    return (
        <tr className="bg-[#fff7fb]">
            <td data-label="Nombre" className="px-5 py-3">
                <TextInput
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    className="block w-full"
                />
                <InputError message={errors.name} className="mt-1" />
            </td>
            <td data-label="Descripción" className="px-5 py-3">
                <TextInput
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    className="block w-full"
                />
            </td>
            <td data-label="Acciones" className="px-5 py-3 md:text-right">
                <div className="flex gap-3 md:justify-end">
                    <button
                        onClick={submit}
                        disabled={processing}
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
