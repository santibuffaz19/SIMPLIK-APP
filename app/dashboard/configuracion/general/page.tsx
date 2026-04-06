'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, Save, Upload, X, Building2, Eye, ShieldCheck, MessageCircle, ArrowLeft, Palette, Coins, Link as LinkIcon } from 'lucide-react';
import { uploadImageAction } from '../../tools/tool-1-QR/actions';

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

    // NUEVOS ESTADOS
    const [instagramUrl, setInstagramUrl] = useState('');
    const [brandColor, setBrandColor] = useState('#4f46e5');
    const [currencySymbol, setCurrencySymbol] = useState('$');

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const { data: settings, error } = await supabase.from('company_settings').select('*').eq('id', 1).single();

            if (settings) {
                setCompanyName(settings.company_name || 'Mi Empresa');
                setBusinessLogo(settings.business_logo_url || null);
                setShowLogoGlobally(settings.show_logo_globally !== false);
                setWhatsappNumber(settings.whatsapp_number || '');
                setInstagramUrl(settings.instagram_url || '');
                setBrandColor(settings.brand_color || '#4f46e5');
                setCurrencySymbol(settings.currency_symbol || '$');
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadImageAction(formData);
            if (res && res.success && res.url) setBusinessLogo(res.url);
        } catch (error) {
            alert("Hubo un error al subir la imagen.");
        } finally {
            setUploadingLogo(false);
            e.target.value = '';
        }
    };

    const handleGuardar = async () => {
        setSaving(true);
        setErrorStatus(null);
        setSuccessMessage(null);

        const { error } = await supabase.from('company_settings').upsert({
            id: 1,
            company_name: companyName,
            business_logo_url: businessLogo,
            show_logo_globally: showLogoGlobally,
            whatsapp_number: whatsappNumber,
            instagram_url: instagramUrl,
            brand_color: brandColor,
            currency_symbol: currencySymbol
        }, { onConflict: 'id' });

        if (error) {
            setErrorStatus('Hubo un error: ' + error.message);
        } else {
            setSuccessMessage('¡Configuración guardada con éxito!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800 pb-20">
            <div className="mb-6">
                <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
                    <ArrowLeft size={16} /> Volver a Ajustes
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">General (Empresa)</h1>
                <p className="text-slate-500 font-medium text-lg">Personalizá tu cuenta y la presencia de tu marca.</p>
            </header>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-bold text-sm flex items-center gap-2">
                    <ShieldCheck size={18} /> {successMessage}
                </div>
            )}

            <div className="space-y-8">
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Building2 className="text-indigo-500" size={24} /> Identidad de Marca
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre Comercial</label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Coins size={16} /> Moneda</label>
                                <select value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium">
                                    <option value="$">$ (Pesos / USD)</option>
                                    <option value="€">€ (Euros)</option>
                                    <option value="£">£ (Libras)</option>
                                    <option value="S/">S/ (Soles)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Palette size={16} /> Color de la Marca</label>
                            <div className="flex items-center gap-4">
                                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer border-0 p-0" />
                                <span className="text-sm text-slate-500 font-mono">{brandColor}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Logo de tu Empresa</label>
                            {!businessLogo ? (
                                <label className="flex flex-col items-center justify-center gap-3 w-full p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all">
                                    {uploadingLogo ? <Loader2 size={32} className="animate-spin text-indigo-500" /> : <><Upload size={24} className="text-slate-400" /><span className="font-bold text-sm">Subir Logo</span></>}
                                    <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" disabled={uploadingLogo} />
                                </label>
                            ) : (
                                <div className="relative inline-block">
                                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 flex items-center justify-center min-w-[200px] min-h-[120px]">
                                        <img src={businessLogo} className="max-h-20 w-auto object-contain" />
                                    </div>
                                    <button onClick={() => setBusinessLogo(null)} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110"><X size={16} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <MessageCircle className="text-emerald-500" size={24} /> Contacto y Redes
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp de Ventas</label>
                            <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="Ej: 5491123456789" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Link de Instagram</label>
                            <input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 font-medium" />
                        </div>
                    </div>
                </section>

                <button onClick={handleGuardar} disabled={saving || uploadingLogo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                    {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                    {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </button>
            </div>
        </div>
    );
}