import Link from 'next/link';
import { Plus, Search, QrCode, Box, Pencil, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DeleteButton from '@/components/DeleteButton'; // Importamos el nuevo componente

export const dynamic = 'force-dynamic';

export default async function ListaProductos() {
    const { data: productosReales, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) console.error('Error cargando productos:', error.message);

    const formatVariantes = (variantsConfig: any) => {
        if (!variantsConfig || variantsConfig.length === 0) return 'Sin variantes';
        return variantsConfig.map((v: any) => v.nombre).join(', ');
    };

    return (
        <div className="max-w-6xl mx-auto text-slate-800 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Productos</h1>
                    <p className="text-slate-500 mt-1">Gestioná tu catálogo y generá etiquetas QR instantáneas.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/productos/importar" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl font-semibold shadow-sm transition-all">
                        <FileSpreadsheet size={20} /> Importar/Exportar
                    </Link>
                    <Link href="/dashboard/productos/nuevo" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all hover:shadow-md">
                        <Plus size={20} /> Nuevo Producto
                    </Link>
                </div>
            </div>

            <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Buscar por nombre o código..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-b-2xl overflow-hidden shadow-sm">
                {productosReales && productosReales.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-4 pl-6 text-slate-600">Producto</th>
                                <th className="p-4 text-slate-600">Código / SKU</th>
                                <th className="p-4 text-slate-600">Precio (Lista)</th>
                                <th className="p-4 text-slate-600">Variantes</th>
                                <th className="p-4 text-right pr-6 text-slate-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {productosReales.map((prod) => (
                                <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                                        <span className="text-xs text-slate-400">{prod.category || 'Sin categoría'}</span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm font-mono">{prod.sku || '-'}</td>
                                    <td className="p-4 font-bold text-slate-900">${prod.price_installments?.toLocaleString('es-AR') || '0'}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {formatVariantes(prod.variants_config)}
                                        </span>
                                    </td>
                                    <td className="p-4 pr-6 flex justify-end gap-1 items-center">
                                        <Link href={`/dashboard/productos/etiqueta/${prod.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Personalizar QR">
                                            <QrCode size={18} />
                                        </Link>
                                        <Link href={`/dashboard/productos/editar/${prod.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar Datos">
                                            <Pencil size={18} />
                                        </Link>

                                        {/* USAMOS EL NUEVO BOTÓN AQUÍ */}
                                        <DeleteButton id={prod.id} />

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-20 text-center text-slate-500">
                        <Box size={60} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-xl font-bold text-slate-900">Tu catálogo está vacío</p>
                    </div>
                )}
            </div>
        </div>
    );
}