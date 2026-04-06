'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, ShieldCheck, Bell, Ruler, MessageSquare, Timer, Package } from 'lucide-react';
import { obtenerConfiguracionPedidosAction, guardarConfiguracionPedidosAction } from '../actions';

export default function ConfiguracionToolPedidos() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados de configuración
    const [alertasSonoras, setAlertasSonoras] = useState(true);
    const [unidadesMedida, setUnidadesMedida] = useState('');
    const [respuestasRapidas, setRespuestasRapidas] = useState('');
    const [autoLimpiezaHoras, setAutoLimpiezaHoras] = useState(12);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const res = await obtenerConfiguracionPedidosAction();
            if (res.success && res.data) {
                setAlertasSonoras(res.data.alertas_sonoras);
                setUnidadesMedida(res.data.unidades_medida || '');
                setRespuestasRapidas(res.data.respuestas_rapidas || '');
                setAutoLimpiezaHoras(res.data.auto_limpieza_horas || 12);
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleGuardar = async () => {
        setSaving(true);
        const res = await guardarConfiguracionPedidosAction({
            alertas_sonoras: alertasSonoras,
            unidades_medida: unidadesMedida,
            respuestas_rapidas: respuestasRapidas,
            auto_limpieza_horas: autoLimpiezaHoras
        });

        if (res.success) {
            setSuccessMessage('¡Configuración actualizada con éxito!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            alert('Error al guardar la configuración.');
        }
        setSaving(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={40} /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8 font-sans text-slate-800 pb-20">
            <div className="mb-6">
                <Link href="/dashboard/configuracion" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <ArrowLeft size={16} /> Volver a Ajustes
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                    <Package className="text-orange-500" size={36} /> Comandas Internas
                </h1>
                <p className="text-slate-500 font-medium text-lg">Personalizá las unidades, alertas y limpieza del tablero.</p>
            </header>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 font-bold flex items-center gap-2">
                    <ShieldCheck size={18} /> {successMessage}
                </div>
            )}

            <div className="space-y-8">
                {/* UNIDADES DE MEDIDA */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Ruler className="text-indigo-500" size={24} /> Unidades de Medida
                    </h2>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Desplegable para el Salón de Ventas</label>
                        <p className="text-xs text-slate-500 mb-3">Escribí las opciones separadas por coma. Estas aparecerán al momento de armar un pedido.</p>
                        <textarea rows={2} value={unidadesMedida} onChange={(e) => setUnidadesMedida(e.target.value)} placeholder="Ej: Unidades, Metros, Kilos..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium text-slate-700" />
                    </div>
                </section>

                {/* RESPUESTAS RÁPIDAS */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <MessageSquare className="text-amber-500" size={24} /> Respuestas Rápidas (Depósito)
                    </h2>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Botones de respuesta inmediata</label>
                        <p className="text-xs text-slate-500 mb-3">Separalas por coma. El depósito podrá usarlas para responder dudas con un solo clic.</p>
                        <textarea rows={2} value={respuestasRapidas} onChange={(e) => setRespuestasRapidas(e.target.value)} placeholder="Ej: Faltan verificar, Demora 15 min..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium text-slate-700" />
                    </div>
                </section>

                {/* ALERTAS Y LIMPIEZA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Bell className="text-red-500" size={24} /> Alertas
                        </h2>
                        <label className="flex items-start gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <input type="checkbox" checked={alertasSonoras} onChange={(e) => setAlertasSonoras(e.target.checked)} className="w-5 h-5 mt-1 text-orange-600 rounded" />
                            <div>
                                <span className="text-base font-bold text-slate-800 block">Alerta Sonora (Depósito)</span>
                                <span className="text-xs text-slate-500 block mt-1">Reproducir un sonido cuando ingrese un pedido nuevo o una urgencia.</span>
                            </div>
                        </label>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Timer className="text-emerald-500" size={24} /> Historial
                        </h2>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Limpieza Automática (TTL)</label>
                            <p className="text-xs text-slate-500 mb-3">Tiempo en horas para ocultar pedidos completados.</p>
                            <div className="flex items-center gap-3">
                                <input type="number" value={autoLimpiezaHoras} onChange={(e) => setAutoLimpiezaHoras(Number(e.target.value))} className="w-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                <span className="font-bold text-slate-600">Horas</span>
                            </div>
                        </div>
                    </section>
                </div>

                <button onClick={handleGuardar} disabled={saving} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all">
                    {saving ? 'Guardando cambios...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
}