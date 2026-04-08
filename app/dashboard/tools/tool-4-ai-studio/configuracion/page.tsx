'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, UserCircle, Loader2 } from 'lucide-react';
import { obtenerModelosGuardadosAction, guardarModeloAction, eliminarModeloAction } from '../actions';
import { uploadImageAction } from '../../tool-1-QR/actions';

export default function ConfigAiStudio() {
    const [modelos, setModelos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estado Form Nuevo Modelo
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevoDesc, setNuevoDesc] = useState('');
    const [nuevasFotos, setNuevasFotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadModelos();
    }, []);

    async function loadModelos() {
        setLoading(true);
        const res = await obtenerModelosGuardadosAction();
        if (res.success && res.data) setModelos(res.data);
        setLoading(false);
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData(); formData.append('file', file);
        const res = await uploadImageAction(formData);
        if (res.success && res.url) setNuevasFotos([...nuevasFotos, res.url]);
        setUploading(false);
    };

    const handleGuardarModelo = async () => {
        if (!nuevoNombre || nuevasFotos.length === 0) return alert("Nombre y al menos 1 foto son requeridos.");
        setSaving(true);
        const data = { name: nuevoNombre, description: nuevoDesc, reference_images: nuevasFotos };
        const res = await guardarModeloAction(data);
        if (res.success) {
            setNuevoNombre(''); setNuevoDesc(''); setNuevasFotos([]);
            await loadModelos();
        }
        setSaving(false);
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Borrar modelo?")) return;
        await eliminarModeloAction(id);
        await loadModelos();
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24">
            <div className="flex items-center gap-4 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/configuracion" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <UserCircle className="text-pink-500" size={32} /> Modelos IA Guardados
                </h1>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
                <h2 className="text-lg font-bold mb-4">Agregar Nuevo Modelo (Max 5)</h2>
                {modelos.length >= 5 ? (
                    <p className="text-orange-600 bg-orange-50 p-4 rounded-xl text-sm font-bold border border-orange-200">Límite de modelos alcanzado. Eliminá uno para agregar otro.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre (Ej: Modelo Mujer 1)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 font-bold text-sm" />
                            <input type="text" value={nuevoDesc} onChange={e => setNuevoDesc(e.target.value)} placeholder="Contexto (Ej: Pelo castaño, casual)" className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Fotos de Referencia (Frente, Perfil, etc)</label>
                            <div className="flex gap-2 flex-wrap">
                                {nuevasFotos.map((f, i) => (
                                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group">
                                        <img src={f} className="w-full h-full object-cover" />
                                        <button onClick={() => setNuevasFotos(nuevasFotos.filter(x => x !== f))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {nuevasFotos.length < 4 && (
                                    <label className="w-16 h-16 border-2 border-dashed border-pink-300 rounded-xl flex items-center justify-center text-pink-400 cursor-pointer hover:bg-pink-50">
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={20} />}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <button onClick={handleGuardarModelo} disabled={saving || !nuevoNombre || nuevasFotos.length === 0} className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                            {saving ? 'Guardando...' : 'Guardar Modelo'}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm">Modelos Existentes</h3>
                {modelos.map(m => (
                    <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                <img src={m.reference_images[0] || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{m.name}</h4>
                                <p className="text-xs text-slate-500">{m.description || 'Sin descripción'}</p>
                            </div>
                        </div>
                        <button onClick={() => handleEliminar(m.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                ))}
                {modelos.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No hay modelos configurados.</p>}
            </div>
        </div>
    );
}