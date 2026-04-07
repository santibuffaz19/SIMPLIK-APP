'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Layers, Loader2 } from 'lucide-react';

export default function NuevaColeccion() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Estados básicos (A completar cuando conectemos la lógica)
    const [name, setName] = useState('');
    const [selectedMagazines, setSelectedMagazines] = useState<any[]>([]);

    const handleGuardar = async () => {
        if (!name) return alert('Poné un nombre a la colección.');
        setSaving(true);
        // Lógica de guardado...
        setTimeout(() => {
            router.push('/dashboard/tools/tool-3-catalogos?tab=colecciones');
            setSaving(false);
        }, 1500);
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
                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Colección</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Temporada Verano 2026 - Completa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm font-bold" />
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[300px]">
                        <h2 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4">Revistas Incluidas ({selectedMagazines.length})</h2>
                        <div className="text-center py-10 text-slate-400">
                            <Layers size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-bold">Próximamente...</p>
                            <p className="text-xs">Acá vas a poder elegir qué revistas forman parte de este link.</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-slate-300 space-y-4 sticky top-6">
                        <h3 className="font-bold text-lg text-white">¿Qué es una colección?</h3>
                        <p className="text-sm leading-relaxed">Es un link único que agrupa varias de tus revistas 3D. Ideal para enviarle a un cliente todo el catálogo de una temporada o categorías específicas (ej: "Solo Calzado").</p>

                        <button onClick={handleGuardar} disabled={saving} className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Crear Link de Colección
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}