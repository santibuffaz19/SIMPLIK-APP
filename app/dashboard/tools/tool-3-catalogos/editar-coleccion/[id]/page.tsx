'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { obtenerCatalogosAction, guardarColeccionAction } from '../../actions';
import { supabase } from '@/lib/supabase';

export default function EditarColeccion() {
    const router = useRouter();
    const { id } = useParams();

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [color, setColor] = useState('#4f46e5');
    const [catalogos, setCatalogos] = useState<any[]>([]);
    const [selectedMagazines, setSelectedMagazines] = useState<any[]>([]);

    useEffect(() => {
        async function fetchAll() {
            const resMags = await obtenerCatalogosAction();
            if (resMags.success && resMags.data) setCatalogos(resMags.data);

            const { data: colData } = await supabase.from('tool_catalog_collections').select('*').eq('id', id).single();
            if (colData) {
                setName(colData.name);
                setColor(colData.cover_color || '#4f46e5');
                try {
                    setSelectedMagazines(JSON.parse(colData.description || '[]'));
                } catch (e) { }
            }
            setLoading(false);
        }
        fetchAll();
    }, [id]);

    const toggleMagazine = (cat: any) => {
        if (selectedMagazines.find(m => m.id === cat.id)) {
            setSelectedMagazines(selectedMagazines.filter(m => m.id !== cat.id));
        } else {
            setSelectedMagazines([...selectedMagazines, { id: cat.id, name: cat.name, cover_title: cat.cover_title, cover_color: cat.cover_color }]);
        }
    };

    const handleGuardar = async () => {
        if (!name) return alert('Poné un nombre a la colección.');
        setSaving(true);
        // Re-guardamos y sobreescribimos
        await supabase.from('tool_catalog_collections').update({
            name, cover_color: color, description: JSON.stringify(selectedMagazines)
        }).eq('id', id);

        router.push('/dashboard/tools/tool-3-catalogos?tab=colecciones');
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-violet-600" size={40} /></div>;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24 relative">
            <div className="flex items-center gap-4 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-3-catalogos?tab=colecciones" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Layers className="text-violet-600" /> Editar Colección
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm font-bold" />
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
                        <h2 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4">Revistas ({selectedMagazines.length})</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {catalogos.map(cat => {
                                const isSelected = selectedMagazines.find(m => m.id === cat.id);
                                return (
                                    <div key={cat.id} onClick={() => toggleMagazine(cat)} className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-violet-600 scale-95 shadow-md' : 'border-transparent hover:border-slate-300 hover:scale-105'}`}>
                                        <div className="h-24 flex items-center justify-center p-3" style={{ backgroundColor: cat.cover_color || '#0a0a0a' }}>
                                            <span className="text-white font-black text-sm text-center uppercase leading-tight line-clamp-2">{cat.cover_title || cat.name}</span>
                                        </div>
                                        <div className="bg-slate-100 p-2 text-center text-[10px] font-bold text-slate-600 truncate">{cat.name}</div>
                                        {isSelected && <div className="absolute top-2 right-2 bg-white rounded-full text-violet-600 shadow-lg"><CheckCircle2 size={20} className="fill-violet-600 text-white" /></div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <button onClick={handleGuardar} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-900/50 sticky top-6">
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} ACTUALIZAR COLECCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
}