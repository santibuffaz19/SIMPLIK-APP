'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { ArrowLeft, Download, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { bulkUpsertProductsAction } from '../actions';

export default function ImportadorMasivo() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleExportar = async () => {
        const { data } = await supabase.from('products').select('*');
        if (!data) return;

        const csvData = data.map(p => ({
            id: p.id,
            nombre: p.name,
            sku: p.sku || '',
            categoria: p.category || '',
            precio_lista: p.price_installments || 0,
            precio_efectivo: p.price_cash || 0,
            descripcion: p.description || '',
            atributos: p.technical_specs?.map((a: any) => `${a.clave}:${a.valor}`).join('|') || '',
            variantes: p.variants_config?.map((v: any) => `${v.nombre}:${v.valores}`).join('|') || '',
            link_externo: p.external_link || ''
        }));

        const csv = Papa.unparse(csvData, { delimiter: ";" });
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "base_productos_simplik.csv");
        link.click();
    };

    const handleImportar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: async (results) => {
                const rawData = results.data;

                const processedData = rawData.map((row: any) => {
                    const product: any = {
                        name: row.nombre,
                        sku: row.sku?.toString(),
                        category: row.categoria,
                        price_installments: parseFloat(row.precio_lista) || 0,
                        price_cash: parseFloat(row.precio_efectivo) || 0,
                        description: row.descripcion,
                        external_link: row.link_externo,
                        technical_specs: row.atributos ? row.atributos.split('|').map((item: string) => {
                            const [clave, valor] = item.split(':');
                            return { id: Math.random(), clave: clave?.trim(), valor: valor?.trim() };
                        }).filter((a: any) => a.clave) : [],
                        variants_config: row.variantes ? row.variantes.split('|').map((item: string) => {
                            const [nombre, valores] = item.split(':');
                            return { id: Math.random(), nombre: nombre?.trim(), valores: valores?.trim() };
                        }).filter((v: any) => v.nombre) : [],
                    };

                    if (row.id && row.id.toString().length > 10) {
                        product.id = row.id;
                    }

                    return product;
                });

                const res = await bulkUpsertProductsAction(processedData);

                if (res.success) {
                    setStatus({ type: 'success', msg: `¡Éxito! Se procesaron ${res.count} productos.` });
                    setTimeout(() => router.push('/dashboard/tools/tool-1-QR'), 1500);
                } else {
                    setStatus({ type: 'error', msg: 'Error al subir los datos. Revisá el formato de las columnas.' });
                }
                setLoading(false);
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-slate-800">
            <Link href="/dashboard/tools/tool-1-QR" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 mt-12 md:mt-0 transition-colors font-medium ml-4 md:ml-0">
                <ArrowLeft size={20} /> Volver a productos
            </Link>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Gestión Masiva (Excel)</h1>
                    <p className="text-slate-500 mt-2 text-sm md:text-lg">Actualizá precios o cargá todo tu inventario en segundos.</p>
                </div>

                <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">

                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Download size={24} />
                        </div>
                        <h3 className="text-xl font-bold">1. Descargar Base</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Bajá el archivo para ver cómo está organizada tu base. Podés abrirlo directamente con **Excel**.</p>
                        <button onClick={handleExportar} className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all w-full justify-center shadow-sm">
                            <FileSpreadsheet size={20} /> Descargar .CSV
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <UploadCloud size={24} />
                        </div>
                        <h3 className="text-xl font-bold">2. Subir Cambios</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Seleccioná el archivo guardado. Si dejás la columna **ID** vacía, se creará un producto nuevo.</p>

                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${loading ? 'bg-slate-100 border-slate-300' : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'}`}>
                            {loading ? (
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            ) : (
                                <>
                                    <UploadCloud className="text-indigo-400 mb-2" size={32} />
                                    <span className="text-sm font-bold text-indigo-600">Elegir archivo CSV</span>
                                </>
                            )}
                            <input type="file" accept=".csv" className="hidden" onChange={handleImportar} disabled={loading} />
                        </label>
                    </div>

                </div>

                {status && (
                    <div className={`p-6 flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        <span className="font-bold text-sm">{status.msg}</span>
                    </div>
                )}
            </div>

            {/* CORRECCIÓN: whitespace-pre-wrap para que el texto baje y no rompa la caja */}
            <div className="mt-8 bg-slate-900 text-slate-300 p-6 md:p-8 rounded-3xl shadow-lg">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-base md:text-lg"> <InfoIcon /> Guía Rápida de Edición</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                        <p className="text-indigo-400 font-bold uppercase tracking-wider text-xs">Atributos (Ficha Técnica)</p>
                        <p>Usá <code className="bg-slate-800 text-indigo-300 px-2 py-1 rounded">Clave:Valor</code> y separá con <code className="text-white">|</code></p>
                        <p className="italic text-slate-500 whitespace-pre-wrap">Ej: Marca:Arcor|Peso:500g|Vence:2026</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Variantes (Opciones)</p>
                        <p>Usá <code className="bg-slate-800 text-emerald-300 px-2 py-1 rounded">Nombre:Opciones</code> y separá con <code className="text-white">|</code></p>
                        <p className="italic text-slate-500 whitespace-pre-wrap">Ej: Color:Rojo,Azul|Talle:S,M,L</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
}