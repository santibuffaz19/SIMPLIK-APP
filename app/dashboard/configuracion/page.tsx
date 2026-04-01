'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Upload, X, Building2, Eye, ShieldCheck } from 'lucide-react';
import { uploadImageAction } from '../productos/actions'; // Usamos tu misma función para subir fotos

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados del Perfil
    const [userId, setUserId] = useState<string | null>(null);
    const [businessLogo, setBusinessLogo] = useState<string | null>(null);
    const [showLogoGlobally, setShowLogoGlobally] = useState<boolean>(true);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);

            // 1. Obtener el usuario logueado
            const { data: { session }, error: authError } = await supabase.auth.getSession();

            if (authError || !session?.user) {
                setErrorStatus('No se encontró una sesión activa.');
                setLoading(false);
                return;
            }

            const uid = session.user.id;
            setUserId(uid);

            // 2. Traer su perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (profile) {
                setBusinessLogo(profile.business_logo_url || null);
                setShowLogoGlobally(profile.show_logo_globally !== false);
            } else if (profileError && profileError.code !== 'PGRST116') {
                // Si hay un error que no sea "no se encontró fila", lo mostramos
                console.error('Error cargando perfil:', profileError);
            }

            setLoading(false);
        }

        fetchProfile();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);

        const res = await uploadImageAction(formData);

        if (res.success && res.url) {
            setBusinessLogo(res.url);
        } else {
            alert("Error al subir el logo: " + res.error);
        }
        setUploadingLogo(false);
    };

    const handleGuardar = async () => {
        if (!userId) return;

        setSaving(true);
        setErrorStatus(null);
        setSuccessMessage(null);

        // Actualizamos o insertamos el perfil
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                business_logo_url: businessLogo,
                show_logo_globally: showLogoGlobally
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
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800">
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

                {/* COLUMNA IZQUIERDA: Formularios */}
                <div className="md:col-span-2 space-y-8">

                    {/* SECCIÓN 1: Branding */}
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Building2 className="text-indigo-500" size={24} /> Identidad de Marca
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Logo de tu Empresa</label>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                    Este logo aparecerá de forma sutil en el pie de página de los catálogos móviles generados por tus códigos QR. Te recomendamos usar una imagen con fondo transparente (PNG).
                                </p>

                                {!businessLogo ? (
                                    <label className="flex flex-col items-center justify-center gap-3 w-full p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all group">
                                        {uploadingLogo ? (
                                            <Loader2 size={32} className="animate-spin text-indigo-500" />
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                    <Upload size={24} className="text-slate-400 group-hover:text-indigo-500" />
                                                </div>
                                                <span className="font-bold text-sm">Subir Logo</span>
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
                                            Si desactivás esto, tu logo NO aparecerá en ningún producto. (Podés anular esta regla editando productos individuales).
                                        </span>
                                    </div>
                                </label>
                            </div>
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

                {/* COLUMNA DERECHA: Tips / Previsualización */}
                <div className="hidden md:block">
                    <div className="sticky top-8 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
                        <div className="flex items-center gap-2 mb-6 text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-white/10 pb-4">
                            <Eye size={14} /> Preview (Mobile)
                        </div>

                        <div className="bg-slate-100 rounded-[2rem] p-4 text-slate-800 flex flex-col items-center justify-end h-64 relative overflow-hidden shadow-inner">
                            {/* Mockup de producto difuminado arriba */}
                            <div className="w-full bg-white rounded-xl p-4 shadow-sm mb-auto opacity-50 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 rounded-full"></div>
                                <div className="h-8 w-1/2 bg-slate-200 rounded-full mt-4"></div>
                            </div>

                            {/* Footer real con logo */}
                            <div className="w-full flex flex-col items-center justify-center gap-3 pt-6 border-t border-slate-200/50">
                                {businessLogo && showLogoGlobally ? (
                                    <div className="flex flex-col items-center justify-center gap-1 opacity-60">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Catálogo de</span>
                                        <img src={businessLogo} alt="Logo" className="max-h-8 max-w-[120px] object-contain grayscale-[30%]" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1 opacity-30">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Sin Identidad</span>
                                        <div className="h-6 w-16 bg-slate-300 rounded-md"></div>
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                    <ShieldCheck size={14} className="text-emerald-500" />
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