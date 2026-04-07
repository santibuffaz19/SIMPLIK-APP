'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { obtenerCatalogosAction, guardarColeccionAction } from '../actions';

export default function NuevaColeccion() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [color, setColor] = useState('#4f46e5');
    const [catalogos, setCatalogos] = useState<any[]>([]);
    const [selectedMagazines, setSelectedMagazines] = useState<any[]>([]);

    useEffect(() => {
        async function fetchMagazines() {
            const res = await obtenerCatalogosAction();
            if (res.success && res.data) setCatalogos(res.data);
            setLoading(false);
        }
        fetchMagazines();
    }, []);

    const toggleMagazine = (cat: any) => {
        if (selectedMagazines.find(m => m.id === cat.id)) {
            setSelectedMagazines(selectedMagazines.filter(m => m.id !== cat.id));
        } else {
            setSelectedMagazines([...selectedMagazines, { id: cat.id, name: cat.name, cover_title: cat.cover_title, cover_color: cat.cover_color }]);
        }
    };

    const handleGuardar = async () => {
        if (!name) return alert('Poné un nombre a la colección.');
        if (selectedMagazines.length === 0) return alert('Seleccioná al menos 1 revista para incluir.');

        setSaving(true);
        const res = await guardarColeccionAction({ name, cover_color: color, magazines: selectedMagazines });

        if (res.success) {
            router.push('/dashboard/tools/tool-3-catalogos?tab=colecciones');
        } else {
            alert('Error al crear colección');
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24 relative">
            <div className="flex items-center gap-4 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-3-catalogos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Layers className="text-violet-600" /> Nueva Colección
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Colección</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Temporada Verano 2026" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm font-bold" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Color Portada</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 h-[54px]">
                                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                    <span className="text-xs font-mono">{color}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[300px]">
                        <h2 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4">Revistas Incluidas ({selectedMagazines.length})</h2>
                        {loading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-500" /></div>
                        ) : catalogos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p>No tenés revistas creadas. Creá una primero.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {catalogos.map(cat => {
                                    const isSelected = selectedMagazines.find(m => m.id === cat.id);
                                    return (
                                        <div key={cat.id} onClick={() => toggleMagazine(cat)} className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-violet-600 scale-95 shadow-md' : 'border-transparent hover:border-slate-300 hover:scale-105'}`}>
                                            <div className="h-24 flex items-center justify-center p-3" style={{ backgroundColor: cat.cover_color || '#0a0a0a' }}>
                                                <span className="text-white font-black text-sm text-center uppercase leading-tight line-clamp-2">{cat.cover_title || cat.name}</span>
                                            </div>
                                            <div className="bg-slate-100 p-2 text-center text-[10px] font-bold text-slate-600 truncate">{cat.name}</div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-white rounded-full text-violet-600 shadow-lg"><CheckCircle2 size={20} className="fill-violet-600 text-white" /></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-slate-300 space-y-4 sticky top-6">
                        <h3 className="font-bold text-lg text-white">¿Qué es una colección?</h3>
                        <p className="text-sm leading-relaxed">Es un link único que agrupa varias de tus revistas 3D. Ideal para enviarle a un cliente todo el catálogo ordenado.</p>

                        <button onClick={handleGuardar} disabled={saving} className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-900/50">
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} CREAR LINK PÚBLICO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}