import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ products }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const [editingId, setEditingId] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const destroy = (product) => {
        if (confirm(`¿Eliminar el producto "${product.name}"?`)) {
            router.delete(route('products.destroy', product.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Productos
                </h2>
            }
        >
            <Head title="Productos" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            Nuevo producto
                        </h3>
                        <form onSubmit={submit} className="flex flex-wrap items-start gap-4">
                            <div>
                                <InputLabel htmlFor="name" value="Nombre" />
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-56"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div className="flex-1">
                                <InputLabel htmlFor="description" value="Descripción (opcional)" />
                                <TextInput
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>
                            <div className="pt-6">
                                <PrimaryButton disabled={processing}>Agregar</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white shadow sm:rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        editing={editingId === product.id}
                                        onEdit={() => setEditingId(product.id)}
                                        onCancelEdit={() => setEditingId(null)}
                                        onDelete={() => destroy(product)}
                                    />
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                            Todavía no hay productos en el catálogo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ProductRow({ product, editing, onEdit, onCancelEdit, onDelete }) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        description: product.description ?? '',
    });

    if (!editing) {
        return (
            <tr className="border-b transition-colors last:border-0 hover:bg-rose-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-600">{product.description || '—'}</td>
                <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={onEdit} className="text-rose-600 hover:underline">
                        Editar
                    </button>
                    <button onClick={onDelete} className="text-red-600 hover:underline">
                        Eliminar
                    </button>
                </td>
            </tr>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        put(route('products.update', product.id), {
            preserveScroll: true,
            onSuccess: onCancelEdit,
        });
    };

    return (
        <tr className="border-b bg-rose-50 last:border-0">
            <td className="px-4 py-2">
                <TextInput
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="block w-full"
                />
                <InputError message={errors.name} className="mt-1" />
            </td>
            <td className="px-4 py-2">
                <TextInput
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="block w-full"
                />
            </td>
            <td className="px-4 py-2 text-right space-x-3">
                <button onClick={submit} disabled={processing} className="text-rose-600 hover:underline">
                    Guardar
                </button>
                <button onClick={onCancelEdit} className="text-gray-500 hover:underline">
                    Cancelar
                </button>
            </td>
        </tr>
    );
}
