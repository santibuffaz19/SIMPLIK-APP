'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, ShieldCheck, BookOpen, Type, Image as ImageIcon } from 'lucide-react';
import { obtenerConfiguracionCatalogosAction, guardarConfiguracionCatalogosAction } from '../actions';

export default function ConfigCatalogos() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [defaultFont, setDefaultFont] = useState('Inter');
    const [watermarkEnabled, setWatermarkEnabled] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            const res = await obtenerConfiguracionCatalogosAction();
            if (res.success && res.data) {
                setDefaultFont(res.data.default_font || 'Inter');
                setWatermarkEnabled(res.data.watermark_enabled !== false);
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleGuardar = async () => {
        setSaving(true);
        const res = await guardarConfiguracionCatalogosAction({ default_font: defaultFont, watermark_enabled: watermarkEnabled });
        if (res.success) {
            setSuccessMessage('¡Configuración actualizada!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-violet-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-20">
            <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm mb-6 mt-12 md:mt-0 ml-4 md:ml-0">
                <ArrowLeft size={16} /> Volver a Ajustes
            </Link>

            <header className="mb-10 px-4 md:px-0">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                    <BookOpen className="text-violet-500" size={32} /> Ajustes de Catálogos 3D
                </h1>
                <p className="text-slate-500 font-medium">Tipografías por defecto y marca de agua.</p>
            </header>

            {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-bold flex items-center gap-2 mx-4 md:mx-0"><ShieldCheck size={18} /> {successMessage}</div>}

            <div className="space-y-6 mx-4 md:mx-0">
                <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><Type className="text-violet-500" size={20} /> Estética Global</h2>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipografía Principal</label>
                        <select value={defaultFont} onChange={e => setDefaultFont(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-slate-700">
                            <option value="Inter">Inter (Moderna y Limpia)</option>
                            <option value="Playfair Display">Playfair (Elegante / Ropa)</option>
                            <option value="Montserrat">Montserrat (Clásica / Joyas)</option>
                            <option value="Space Grotesk">Space Grotesk (Urbana / Tech)</option>
                        </select>
                    </div>
                </section>

                <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><ImageIcon className="text-violet-500" size={20} /> Presencia de Marca</h2>
                    <label className="flex items-start gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <input type="checkbox" checked={watermarkEnabled} onChange={(e) => setWatermarkEnabled(e.target.checked)} className="w-5 h-5 mt-1 text-violet-600 rounded shrink-0" />
                        <div>
                            <span className="text-base font-bold text-slate-800 block">Mostrar "Powered by Simplik"</span>
                            <span className="text-xs md:text-sm text-slate-500 block mt-1">Muestra una pequeña marca de agua en la última página de las revistas.</span>
                        </div>
                    </label>
                </section>

                <button onClick={handleGuardar} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Guardar Ajustes
                </button>
            </div>
        </div>
    );
}