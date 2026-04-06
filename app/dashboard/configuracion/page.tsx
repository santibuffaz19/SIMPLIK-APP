'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, Save, QrCode, ArrowLeft, Ruler, LayoutTemplate, ShieldCheck } from 'lucide-react';

export default function ConfiguracionToolQR() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados de esta Tool
    const [widthMm, setWidthMm] = useState<number>(50);
    const [heightMm, setHeightMm] = useState<number>(25);
    const [layout, setLayout] = useState('qr-right');

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const { data, error } = await supabase.from('tool_qr_settings').select('*').eq('id', 1).single();
            if (data) {
                setWidthMm(data.default_width_mm || 50);
                setHeightMm(data.default_height_mm || 25);
                setLayout(data.default_layout || 'qr-right');
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleGuardar = async () => {
        setSaving(true);
        setErrorStatus(null);
        setSuccessMessage(null);

        const { error } = await supabase
            .from('tool_qr_settings')
            .upsert({
                id: 1,
                default_width_mm: widthMm,
                default_height_mm: heightMm,
                default_layout: layout
            }, { onConflict: 'id' });

        if (error) {
            setErrorStatus('Error al guardar: ' + error.message);
        } else {
            setSuccessMessage('¡Ajustes del Catálogo QR guardados con éxito!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800 pb-20">
            <div className="mb-6">
                <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
                    <ArrowLeft size={16} /> Volver a Ajustes
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                    <QrCode className="text-emerald-500" size={36} /> Catálogo QR
                </h1>
                <p className="text-slate-500 font-medium text-lg">Preferencias por defecto para la generación de etiquetas.</p>
            </header>

            {errorStatus && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 font-medium text-sm flex items-center gap-2">
                    <span>⚠️</span> {errorStatus}
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-bold text-sm flex items-center gap-2">
                    <ShieldCheck size={18} /> {successMessage}
                </div>
            )}

            <div className="space-y-8">
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Ruler className="text-emerald-500" size={24} /> Medidas por Defecto
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Estas medidas cargarán automáticamente cuando vayas a imprimir una nueva etiqueta.</p>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ancho (mm)</label>
                            <input
                                type="number"
                                value={widthMm}
                                onChange={(e) => setWidthMm(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Alto (mm)</label>
                            <input
                                type="number"
                                value={heightMm}
                                onChange={(e) => setHeightMm(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <LayoutTemplate className="text-emerald-500" size={24} /> Layout del QR por Defecto
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${layout === 'qr-left' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'}`}>
                            <input type="radio" name="layout" value="qr-left" checked={layout === 'qr-left'} onChange={(e) => setLayout(e.target.value)} className="hidden" />
                            <div className="w-full h-12 bg-white border border-slate-200 rounded flex items-center p-1">
                                <div className="w-10 h-10 bg-slate-800 rounded-sm"></div>
                                <div className="flex-1 flex flex-col gap-1 ml-2"><div className="w-full h-2 bg-slate-200 rounded"></div><div className="w-1/2 h-2 bg-slate-200 rounded"></div></div>
                            </div>
                            <span className="font-bold text-sm text-slate-700">QR Izquierda</span>
                        </label>

                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${layout === 'qr-right' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'}`}>
                            <input type="radio" name="layout" value="qr-right" checked={layout === 'qr-right'} onChange={(e) => setLayout(e.target.value)} className="hidden" />
                            <div className="w-full h-12 bg-white border border-slate-200 rounded flex items-center p-1">
                                <div className="flex-1 flex flex-col gap-1 mr-2"><div className="w-full h-2 bg-slate-200 rounded"></div><div className="w-1/2 h-2 bg-slate-200 rounded"></div></div>
                                <div className="w-10 h-10 bg-slate-800 rounded-sm"></div>
                            </div>
                            <span className="font-bold text-sm text-slate-700">QR Derecha</span>
                        </label>

                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${layout === 'qr-center' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'}`}>
                            <input type="radio" name="layout" value="qr-center" checked={layout === 'qr-center'} onChange={(e) => setLayout(e.target.value)} className="hidden" />
                            <div className="w-full h-12 bg-white border border-slate-200 rounded flex items-center p-1 gap-2">
                                <div className="flex-1 flex flex-col gap-1"><div className="w-full h-2 bg-slate-200 rounded"></div></div>
                                <div className="w-10 h-10 bg-slate-800 rounded-sm shrink-0"></div>
                                <div className="flex-1 flex flex-col gap-1 items-end"><div className="w-full h-2 bg-slate-200 rounded"></div></div>
                            </div>
                            <span className="font-bold text-sm text-slate-700">QR Centro</span>
                        </label>
                    </div>
                </section>

                <button
                    onClick={handleGuardar}
                    disabled={saving}
                    className={`w-full max-w-sm mx-auto bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                >
                    {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {saving ? 'Guardando...' : 'Guardar Ajustes de QR'}
                </button>
            </div>
        </div>
    );
}