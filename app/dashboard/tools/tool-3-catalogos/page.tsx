'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Library, Plus, Trash2, Edit3, ExternalLink, RefreshCw, Layers, Link as LinkIcon, Check } from 'lucide-react';
import { obtenerCatalogosAction, eliminarCatalogoAction, obtenerColeccionesAction, eliminarColeccionAction } from './actions';

export default function CatalogosDashboard() {
    const [activeTab, setActiveTab] = useState<'revistas' | 'colecciones'>('revistas');
    const [catalogos, setCatalogos] = useState<any[]>([]);
    const [colecciones, setColecciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'colecciones') setActiveTab('colecciones');
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
        setCatalogos(catalogos.filter(c => c.id !== id));
        await eliminarCatalogoAction(id);
    };

    const handleEliminarColeccion = async (id: string) => {
        if (!confirm('¿Seguro que querés eliminar esta colección?')) return;
        setColecciones(colecciones.filter(c => c.id !== id));
        await eliminarColeccionAction(id);
    };

    const copiarLink = (path: string, id: string) => {
        navigator.clipboard.writeText(`${window.location.origin}${path}`);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
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

                                    <div className="mt-auto flex flex-col gap-2">
                                        <button onClick={() => copiarLink(`/r/${cat.id}`, cat.id)} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${copiedId === cat.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {copiedId === cat.id ? <><Check size={16} /> Copiado</> : <><LinkIcon size={16} /> Copiar Link Público</>}
                                        </button>
                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEliminarCatalogo(cat.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                <Link href={`/dashboard/tools/tool-3-catalogos/editar/${cat.id}`} className="p-2 text-slate-400 hover:text-violet-600 bg-slate-50 rounded-lg transition-colors"><Edit3 size={16} /></Link>
                                            </div>
                                            <a href={`/r/${cat.id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors">
                                                Abrir <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {colecciones.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No hay colecciones</h3>
                            <p className="text-slate-500 mb-6">Agrupá múltiples revistas en un solo link.</p>
                            <Link href="/dashboard/tools/tool-3-catalogos/nueva-coleccion" className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Armar Colección</Link>
                        </div>
                    ) : (
                        colecciones.map(col => {
                            let mags = [];
                            try { mags = JSON.parse(col.description || '[]'); } catch (e) { }

                            return (
                                <div key={col.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className="h-32 flex flex-col items-center justify-center p-4 relative" style={{ backgroundColor: col.cover_color || '#4f46e5' }}>
                                        <Layers className="text-white/50 mb-2" size={24} />
                                        <h3 className="text-white font-black text-xl text-center z-10 truncate w-full px-4">{col.name}</h3>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <p className="text-sm font-bold text-slate-500 mb-4">{mags.length} Revistas incluidas</p>
                                        <div className="mt-auto flex flex-col gap-2">
                                            <button onClick={() => copiarLink(`/c/${col.id}`, col.id)} className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${copiedId === col.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                {copiedId === col.id ? <><Check size={16} /> Copiado</> : <><LinkIcon size={16} /> Copiar Link Público</>}
                                            </button>
                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <button onClick={() => handleEliminarColeccion(col.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                <a href={`/c/${col.id}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                                    Abrir Vidriera <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}