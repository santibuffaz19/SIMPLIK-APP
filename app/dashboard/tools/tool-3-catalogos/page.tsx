'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Library, Plus, Trash2, Edit3, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { obtenerCatalogosAction, eliminarCatalogoAction, obtenerColeccionesAction } from './actions';

export default function CatalogosDashboard() {
    const [activeTab, setActiveTab] = useState<'revistas' | 'colecciones'>('revistas');
    const [catalogos, setCatalogos] = useState<any[]>([]);
    const [colecciones, setColecciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        const resCat = await obtenerCatalogosAction();
        if (resCat.success && resCat.data) setCatalogos(resCat.data);

        const resCol = await obtenerColeccionesAction();
        if (resCol.success && resCol.data) setColecciones(resCol.data);
        setLoading(false);
    };

    const handleEliminarCatalogo = async (id: string) => {
        if (!confirm('¿Seguro que querés eliminar esta revista interactiva?')) return;
        // Borrado optimista de la UI
        setCatalogos(catalogos.filter(c => c.id !== id));
        await eliminarCatalogoAction(id);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-800 min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 mt-12 md:mt-0 ml-12 md:ml-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="text-violet-600" size={36} /> Catálogos 3D
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Lookbooks interactivos y colecciones para clientes.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tools/tool-3-catalogos/nueva-coleccion" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl font-bold shadow-sm transition-all text-sm">
                        <Library size={18} /> Nueva Colección
                    </Link>
                    <Link href="/dashboard/tools/tool-3-catalogos/nuevo" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-violet-600/20 transition-all text-sm active:scale-95">
                        <Plus size={18} /> Crear Revista
                    </Link>
                </div>
            </header>

            <div className="flex gap-4 border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
                <button onClick={() => setActiveTab('revistas')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'revistas' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <BookOpen size={16} /> Mis Revistas ({catalogos.length})
                </button>
                <button onClick={() => setActiveTab('colecciones')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'colecciones' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Layers size={16} /> Colecciones ({colecciones.length})
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><RefreshCw className="animate-spin text-violet-500" size={32} /></div>
            ) : activeTab === 'revistas' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {catalogos.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No hay revistas creadas</h3>
                            <p className="text-slate-500 mb-6">Empezá creando tu primer catálogo interactivo.</p>
                            <Link href="/dashboard/tools/tool-3-catalogos/nuevo" className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-bold">Crear Revista</Link>
                        </div>
                    ) : (
                        catalogos.map(cat => (
                            <div key={cat.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="h-40 flex items-center justify-center p-6 relative" style={{ backgroundColor: cat.cover_color || '#0a0a0a' }}>
                                    <h3 className="text-white font-black text-2xl text-center z-10 uppercase tracking-widest" style={{ fontFamily: cat.font_family }}>{cat.cover_title || cat.name}</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="font-bold text-slate-900 text-lg mb-1">{cat.name}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{cat.description || 'Sin descripción'}</p>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEliminarCatalogo(cat.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            <Link href={`/dashboard/tools/tool-3-catalogos/editar/${cat.id}`} className="p-2 text-slate-400 hover:text-violet-600 bg-slate-50 rounded-lg transition-colors"><Edit3 size={16} /></Link>
                                        </div>
                                        <a href={`/r/${cat.id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors">
                                            Ver Revista <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                        <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Gestor de Colecciones</h3>
                        <p className="text-slate-500">Agrupá múltiples revistas en un solo link.</p>
                    </div>
                </div>
            )}
        </div>
    );
}