'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, Save, QrCode, ArrowLeft, Ruler, LayoutTemplate, ShieldCheck, EyeOff, ListTree, Printer } from 'lucide-react';

export default function ConfiguracionToolQR() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados base
    const [widthMm, setWidthMm] = useState<number>(50);
    const [heightMm, setHeightMm] = useState<number>(25);
    const [layout, setLayout] = useState('qr-right');

    // NUEVOS ESTADOS DE ESTA TOOL
    const [defaultShowPrice, setDefaultShowPrice] = useState(true);
    const [defaultAttributes, setDefaultAttributes] = useState('Marca, Material');
    const [marginTopMm, setMarginTopMm] = useState(0);
    const [marginLeftMm, setMarginLeftMm] = useState(0);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const { data } = await supabase.from('tool_qr_settings').select('*').eq('id', 1).single();
            if (data) {
                setWidthMm(data.default_width_mm || 50);
                setHeightMm(data.default_height_mm || 25);
                setLayout(data.default_layout || 'qr-right');
                setDefaultShowPrice(data.default_show_price !== false);
                setDefaultAttributes(data.default_attributes || 'Marca, Material');
                setMarginTopMm(data.margin_top_mm || 0);
                setMarginLeftMm(data.margin_left_mm || 0);
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleGuardar = async () => {
        setSaving(true);
        const { error } = await supabase.from('tool_qr_settings').upsert({
            id: 1,
            default_width_mm: widthMm,
            default_height_mm: heightMm,
            default_layout: layout,
            default_show_price: defaultShowPrice,
            default_attributes: defaultAttributes,
            margin_top_mm: marginTopMm,
            margin_left_mm: marginLeftMm
        }, { onConflict: 'id' });

        if (!error) {
            setSuccessMessage('¡Ajustes del Catálogo guardados!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800 pb-20">
            <div className="mb-6">
                <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <ArrowLeft size={16} /> Volver a Ajustes
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                    <QrCode className="text-emerald-500" size={36} /> Ajustes del Catálogo
                </h1>
                <p className="text-slate-500 font-medium text-lg">Preferencias de venta y diseño de etiquetas.</p>
            </header>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-bold flex items-center gap-2">
                    <ShieldCheck size={18} /> {successMessage}
                </div>
            )}

            <div className="space-y-8">
                {/* MODO MAYORISTA Y ATRIBUTOS */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <EyeOff className="text-emerald-500" size={24} /> Privacidad y Plantillas
                    </h2>

                    <div className="space-y-6">
                        <label className="flex items-start gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <input type="checkbox" checked={!defaultShowPrice} onChange={(e) => setDefaultShowPrice(!e.target.checked)} className="w-5 h-5 mt-1 text-emerald-600 rounded" />
                            <div>
                                <span className="text-base font-bold text-slate-800 block">Modo Mayorista (Ocultar Precios)</span>
                                <span className="text-sm text-slate-500 block">Si activás esto, el cliente que escanee el QR NO verá los precios de ningún producto.</span>
                            </div>
                        </label>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ListTree size={16} /> Plantilla de Atributos Fijos</label>
                            <p className="text-xs text-slate-500 mb-2">Escribí los datos separados por coma. Aparecerán vacíos listos para llenar al crear un producto.</p>
                            <input type="text" value={defaultAttributes} onChange={(e) => setDefaultAttributes(e.target.value)} placeholder="Ej: Marca, Material, Origen" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        </div>
                    </div>
                </section>

                {/* MEDIDAS Y LAYOUT */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Ruler className="text-emerald-500" size={24} /> Diseño de la Etiqueta PDF
                    </h2>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ancho Físico (mm)</label>
                            <input type="number" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Alto Físico (mm)</label>
                            <input type="number" value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => setLayout('qr-left')} className={`p-4 rounded-xl border-2 font-bold text-sm ${layout === 'qr-left' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>QR Izquierda</button>
                        <button onClick={() => setLayout('qr-center')} className={`p-4 rounded-xl border-2 font-bold text-sm ${layout === 'qr-center' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>QR Centro</button>
                        <button onClick={() => setLayout('qr-right')} className={`p-4 rounded-xl border-2 font-bold text-sm ${layout === 'qr-right' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>QR Derecha</button>
                    </div>
                </section>

                {/* AJUSTES FINOS IMPRESORA */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Printer className="text-emerald-500" size={24} /> Ajustes Finos de Impresora
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">Si tu impresora térmica corta el texto, empujá el diseño usando estos márgenes.</p>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Empujar desde Arriba (mm)</label>
                            <input type="number" value={marginTopMm} onChange={(e) => setMarginTopMm(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Empujar desde Izquierda (mm)</label>
                            <input type="number" value={marginLeftMm} onChange={(e) => setMarginLeftMm(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                    </div>
                </section>

                <button onClick={handleGuardar} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-lg shadow-lg">
                    {saving ? 'Guardando...' : 'Guardar Ajustes'}
                </button>
            </div>
        </div>
    );
}