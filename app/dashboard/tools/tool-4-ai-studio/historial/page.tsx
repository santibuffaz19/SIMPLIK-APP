'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Film, Download, RefreshCw, Trash2, Loader2, Filter, Search, Play, CheckCircle2, Clock, AlertCircle, History } from 'lucide-react';
import { getGenerationsHistoryAction, deleteGenerationAction } from '../actions';

const PIPELINE_LABELS: Record<string, string> = {
    product_photo: 'Producto',
    fashion_photo: 'Moda',
    food_photo: 'Comida',
    product_video: 'Producto',
    fashion_video: 'Moda',
    food_video: 'Comida',
};

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
    completed: { icon: CheckCircle2, label: 'Completado', color: 'text-emerald-600' },
    processing: { icon: Clock, label: 'Procesando', color: 'text-amber-600' },
    pending: { icon: Clock, label: 'Pendiente', color: 'text-slate-500' },
    failed: { icon: AlertCircle, label: 'Error', color: 'text-red-600' },
};

export default function HistorialPage() {
    const [generaciones, setGeneraciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
    const [filterPipeline, setFilterPipeline] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        loadHistory();
    }, [filterType]);

    const loadHistory = async () => {
        setLoading(true);
        const res = await getGenerationsHistoryAction({
            type: filterType === 'all' ? undefined : filterType as 'photo' | 'video',
            limit: 60,
        });
        if (res.success && res.data) setGeneraciones(res.data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta generación del historial?')) return;
        setGeneraciones(prev => prev.filter(g => g.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
        await deleteGenerationAction(id);
    };

    const filtered = generaciones.filter(g => {
        if (filterPipeline !== 'all' && g.pipeline !== filterPipeline) return false;
        if (search) {
            const s = search.toLowerCase();
            const matchPipeline = g.pipeline?.includes(s);
            const matchPrompt = g.final_prompt?.toLowerCase().includes(s);
            if (!matchPipeline && !matchPrompt) return false;
        }
        return true;
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-16">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-4-ai-studio" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">Historial de Generaciones</h1>
                    <p className="text-slate-500 text-sm font-medium">{generaciones.length} generaciones guardadas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por prompt..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 bg-slate-50" />
                </div>
                <div className="flex gap-2">
                    {(['all', 'photo', 'video'] as const).map(t => (
                        <button key={t} onClick={() => setFilterType(t)}
                            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${filterType === t ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                            {t === 'photo' && <Camera size={14} />}
                            {t === 'video' && <Film size={14} />}
                            {t === 'all' ? 'Todos' : t === 'photo' ? 'Fotos' : 'Videos'}
                        </button>
                    ))}
                </div>
                <select value={filterPipeline} onChange={e => setFilterPipeline(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 focus:outline-none">
                    <option value="all">Todos los modos</option>
                    <option value="product_photo">Foto Producto</option>
                    <option value="fashion_photo">Foto Moda</option>
                    <option value="food_photo">Foto Comida</option>
                    <option value="product_video">Video Producto</option>
                    <option value="fashion_video">Video Moda</option>
                    <option value="food_video">Video Comida</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-rose-600" size={36} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <History size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Sin generaciones</h3>
                    <p className="text-slate-500 mb-6">Todavía no generaste ningún contenido con IA.</p>
                    <Link href="/dashboard/tools/tool-4-ai-studio/generador?tipo=foto" className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-black hover:bg-rose-700 transition-colors">
                        <Camera size={18} /> Crear primera sesión
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map(gen => {
                        const statusCfg = STATUS_CONFIG[gen.status] || STATUS_CONFIG.pending;
                        const isPhoto = gen.generation_type === 'photo';

                        return (
                            <div key={gen.id}
                                onClick={() => setSelectedItem(gen)}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group">

                                {/* Thumbnail */}
                                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                    {gen.output_url && gen.status === 'completed' ? (
                                        isPhoto
                                            ? <img src={gen.output_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                                    <Play size={32} className="text-white/70" />
                                                </div>
                                            )
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            {gen.status === 'processing' || gen.status === 'pending'
                                                ? <Loader2 size={24} className="animate-spin text-slate-400" />
                                                : <AlertCircle size={24} className="text-red-400" />}
                                        </div>
                                    )}

                                    {/* Tipo badge */}
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isPhoto ? 'bg-rose-600 text-white' : 'bg-violet-600 text-white'}`}>
                                        {isPhoto ? <Camera size={10} /> : <Film size={10} />}
                                        {PIPELINE_LABELS[gen.pipeline] || gen.pipeline}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-[10px] text-slate-400 font-medium mb-1">{formatDate(gen.created_at)}</p>
                                    <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight">
                                        {gen.final_prompt?.slice(0, 80) || 'Sin prompt'}...
                                    </p>
                                    <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${statusCfg.color}`}>
                                        <statusCfg.icon size={11} />
                                        {statusCfg.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de detalle */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-xl text-slate-900">
                                    {selectedItem.generation_type === 'photo' ? '📷' : '🎬'} {PIPELINE_LABELS[selectedItem.pipeline] || selectedItem.pipeline}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{formatDate(selectedItem.created_at)}</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedItem.output_url && (
                                    <a href={selectedItem.output_url} download target="_blank"
                                        className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                                        <Download size={14} /> Descargar
                                    </a>
                                )}
                                <Link href={`/dashboard/tools/tool-4-ai-studio/generador?tipo=${selectedItem.generation_type === 'photo' ? 'foto' : 'video'}`}
                                    className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors">
                                    <RefreshCw size={14} /> Regenerar
                                </Link>
                                <button onClick={() => handleDelete(selectedItem.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {/* Resultado */}
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Resultado</p>
                                {selectedItem.output_url && selectedItem.status === 'completed' ? (
                                    selectedItem.generation_type === 'photo'
                                        ? <img src={selectedItem.output_url} className="w-full rounded-2xl border border-slate-200" />
                                        : <video src={selectedItem.output_url} controls className="w-full rounded-2xl bg-black" />
                                ) : (
                                    <div className="aspect-square flex items-center justify-center bg-slate-100 rounded-2xl">
                                        {STATUS_CONFIG[selectedItem.status]?.label || 'Sin resultado'}
                                    </div>
                                )}
                            </div>

                            {/* Parámetros */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Prompt Final</p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed max-h-28 overflow-y-auto">
                                        {selectedItem.final_prompt}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {[
                                        { label: 'Tipo', value: selectedItem.generation_type === 'photo' ? 'Foto' : 'Video' },
                                        { label: 'Pipeline', value: PIPELINE_LABELS[selectedItem.pipeline] || selectedItem.pipeline },
                                        { label: 'Proveedor', value: selectedItem.ai_provider },
                                        { label: 'Modelo IA', value: selectedItem.ai_model },
                                        { label: 'Fondo', value: selectedItem.background_preset || selectedItem.background_type || '-' },
                                        { label: 'Estilo', value: selectedItem.style || '-' },
                                        { label: 'Pose', value: selectedItem.pose || '-' },
                                        { label: 'Estado', value: STATUS_CONFIG[selectedItem.status]?.label || selectedItem.status },
                                    ].map(item => (
                                        <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{item.label}</p>
                                            <p className="font-bold text-slate-800 mt-0.5 truncate">{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Referencias usadas */}
                                {selectedItem.uploaded_reference_images?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Referencias usadas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.uploaded_reference_images.slice(0, 4).map((url: string, i: number) => (
                                                <img key={i} src={url} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}