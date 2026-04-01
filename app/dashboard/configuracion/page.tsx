'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Upload, X, Building2, Eye, ShieldCheck, MessageCircle } from 'lucide-react';
// IMPORTANTE: Asegurate de que esta ruta apunte bien a tu archivo actions.ts
import { uploadImageAction } from '../productos/actions';

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados de Configuración
    const [companyName, setCompanyName] = useState('Mi Empresa');
    const [businessLogo, setBusinessLogo] = useState<string | null>(null);
    const [showLogoGlobally, setShowLogoGlobally] = useState<boolean>(true);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);

            // Traemos la configuración global (id = 1)
            const { data: settings, error } = await supabase
                .from('company_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (settings) {
                setCompanyName(settings.company_name || 'Mi Empresa');
                setBusinessLogo(settings.business_logo_url || null);
                setShowLogoGlobally(settings.show_logo_globally !== false);
                setWhatsappNumber(settings.whatsapp_number || '');
            } else if (error && error.code !== 'PGRST116') {
                console.error('Error cargando configuración:', error);
            }

            setLoading(false);
        }

        fetchSettings();
    }, []);

    // NUEVO ESCUDO: Try/Catch para que la ruedita nunca quede infinita
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await uploadImageAction(formData);

            if (res && res.success && res.url) {
                setBusinessLogo(res.url);
            } else {
                alert("No se pudo subir la imagen: " + (res?.error || "Error desconocido"));
            }
        } catch (error) {
            console.error("Error crítico al subir:", error);
            alert("Hubo un corte en la conexión. Intentá de nuevo.");
        } finally {
            // SIEMPRE frena la ruedita, pase lo que pase
            setUploadingLogo(false);
            // Resetea el input para que te deje clickear la misma foto de nuevo si te equivocaste
            e.target.value = '';
        }
    };

    const handleGuardar = async () => {
        setSaving(true);
        setErrorStatus(null);
        setSuccessMessage(null);

        const { error } = await supabase
            .from('company_settings')
            .upsert({
                id: 1,
                company_name: companyName,
                business_logo_url: businessLogo,
                show_logo_globally: showLogoGlobally,
                whatsapp_number: whatsappNumber
            }, { onConflict: 'id' });

        if (error) {
            setErrorStatus('Hubo un error al guardar la configuración: ' + error.message);
        } else {
            setSuccessMessage('¡Configuración guardada con éxito!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }

        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800 pb-20">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Configuración</h1>
                <p className="text-slate-500 font-medium text-lg">Personalizá tu cuenta y la presencia de tu marca.</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-2 space-y-8">
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Building2 className="text-indigo-500" size={24} /> Identidad de Marca
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Comercial</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ej: Tienda Simplik"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Logo de tu Empresa</label>
                                {!businessLogo ? (
                                    <label className="flex flex-col items-center justify-center gap-3 w-full p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all group">
                                        {uploadingLogo ? (
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                    <Upload size={24} className="text-slate-400 group-hover:text-indigo-500" />
                                                </div>
                                                <span className="font-bold text-sm">Subir Logo (PNG/JPG)</span>
                                            </>
                                        )}
                                        <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" disabled={uploadingLogo} />
                                    </label>
                                ) : (
                                    <div className="relative inline-block group">
                                        <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex items-center justify-center min-w-[200px] min-h-[120px]">
                                            <img src={businessLogo} className="max-h-20 w-auto object-contain" alt="Logo Empresa" />
                                        </div>
                                        <button
                                            onClick={() => setBusinessLogo(null)}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
                                            title="Eliminar logo"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="mt-1">
                                        <input
                                            type="checkbox"
                                            checked={showLogoGlobally}
                                            onChange={(e) => setShowLogoGlobally(e.target.checked)}
                                            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors block mb-1">
                                            Mostrar logo globalmente
                                        </span>
                                        <span className="text-sm text-slate-500 block">
                                            Si desactivás esto, tu logo NO aparecerá en ningún producto, sin importar lo que elijas al crearlo.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <MessageCircle className="text-emerald-500" size={24} /> Contacto
                        </h2>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp (Ventas / Consultas)</label>
                            <p className="text-xs text-slate-500 mb-3">Si completás esto, aparecerá un botón sutil al final del producto para que te consulten directo.</p>
                            <input
                                type="text"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="Ej: 5491123456789"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                            />
                        </div>
                    </section>

                    <button
                        onClick={handleGuardar}
                        disabled={saving || uploadingLogo}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                        {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                </div>

                <div className="hidden md:block">
                    <div className="sticky top-8 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
                        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-white/10 pb-4">
                            <Eye size={14} /> Preview (Mobile Footer)
                        </div>

                        <div className="bg-slate-100 rounded-[2rem] p-4 text-slate-800 flex flex-col items-center justify-end h-72 relative overflow-hidden shadow-inner">
                            <div className="w-full bg-white rounded-xl p-4 shadow-sm mb-auto opacity-50 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 rounded-full"></div>
                                <div className="h-8 w-1/2 bg-slate-200 rounded-full mt-4"></div>
                            </div>

                            <div className="w-full flex flex-col items-center justify-center gap-4 pt-6 border-t border-slate-200/50">

                                {whatsappNumber && (
                                    <div className="bg-white px-4 py-2 rounded-full border border-emerald-200 shadow-sm flex items-center gap-2">
                                        <MessageCircle size={14} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Consultar</span>
                                    </div>
                                )}

                                {businessLogo && showLogoGlobally ? (
                                    <div className="flex flex-col items-center justify-center gap-1 opacity-60">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Catálogo de {companyName}</span>
                                        <img src={businessLogo} alt="Logo" className="max-h-8 max-w-[120px] object-contain grayscale-[30%]" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1 opacity-40">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Catálogo de {companyName || 'Mi Empresa'}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                    <ShieldCheck size={14} className="text-indigo-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Info Verificada por Simplik</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}