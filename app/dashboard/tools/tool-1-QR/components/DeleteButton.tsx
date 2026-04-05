'use client' // Este archivo sí puede tener interactividad

import { Trash2 } from 'lucide-react';
import { deleteProductAction } from '@/app/dashboard/tools/tool-1-QR/actions';

export default function DeleteButton({ id }: { id: string }) {
    const handleDelete = async () => {
        const confirmed = window.confirm('¿Estás seguro de eliminar este producto?');
        if (confirmed) {
            await deleteProductAction(id);
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Eliminar"
        >
            <Trash2 size={18} />
        </button>
    );
}