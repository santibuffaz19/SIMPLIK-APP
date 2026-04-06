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

    // Lógica condicional para el TTL
    const [autoLimpiezaActiva, setAutoLimpiezaActiva] = useState(true);
    const [autoLimpiezaHoras, setAutoLimpiezaHoras] = useState(12);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const res = await obtenerConfiguracionPedidosAction();
            if (res.success && res.data) {
                setAlertasSonoras(res.data.alertas_sonoras);
                setUnidadesMedida(res.data.unidades_medida || '');
                setRespuestasRapidas(res.data.respuestas_rapidas || '');

                if (res.data.auto_limpieza_horas === 0) {
                    setAutoLimpiezaActiva(false);
                    setAutoLimpiezaHoras(12); // Valor por defecto visual
                } else {
                    setAutoLimpiezaActiva(true);
                    setAutoLimpiezaHoras(res.data.auto_limpieza_horas || 12);
                }
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
            auto_limpieza_horas: autoLimpiezaActiva ? autoLimpiezaHoras : 0
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
                        <p className="text-xs text-slate-500 mb-3">Escribí las opciones separadas por coma.</p>
                        <textarea rows={2} value={unidadesMedida} onChange={(e) => setUnidadesMedida(e.target.value)} placeholder="Ej: Unidades, Metros, Kilos, Rollos..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-medium text-slate-700" />
                    </div>
                </section>

                {/* RESPUESTAS RÁPIDAS */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <MessageSquare className="text-amber-500" size={24} /> Respuestas Rápidas (Depósito)
                    </h2>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Botones de respuesta inmediata</label>
                        <p className="text-xs text-slate-500 mb-3">Separalas por coma. Útiles para agilizar la comunicación operativa.</p>
                        <textarea rows={2} value={respuestasRapidas} onChange={(e) => setRespuestasRapidas(e.target.value)} placeholder="Ej: Falta verificar en sistema, Demora 15 min..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium text-slate-700" />
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ALERTAS SONORAS */}
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Bell className="text-red-500" size={24} /> Alertas
                        </h2>
                        <label className="flex items-start gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <input type="checkbox" checked={alertasSonoras} onChange={(e) => setAlertasSonoras(e.target.checked)} className="w-5 h-5 mt-1 text-orange-600 rounded" />
                            <div>
                                <span className="text-base font-bold text-slate-800 block">Alerta Sonora (Depósito)</span>
                                <span className="text-xs text-slate-500 block mt-1">Generar tono al recibir nuevas comandas.</span>
                            </div>
                        </label>
                    </section>

                    {/* LIMPIEZA / TTL */}
                    <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Timer className="text-emerald-500" size={24} /> Historial
                        </h2>
                        <div className="space-y-4">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <input type="checkbox" checked={autoLimpiezaActiva} onChange={(e) => setAutoLimpiezaActiva(e.target.checked)} className="w-5 h-5 mt-0.5 text-emerald-600 rounded" />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Ocultar pedidos antiguos automáticamente</span>
                                    <span className="text-xs text-slate-500 block">Si está desactivado, el historial será infinito.</span>
                                </div>
                            </label>

                            {autoLimpiezaActiva && (
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in">
                                    {/* BLINDAJE: min="1" y validación onChange para que no baje de 1 */}
                                    <input
                                        type="number"
                                        min="1"
                                        value={autoLimpiezaHoras}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setAutoLimpiezaHoras(isNaN(val) || val < 1 ? 1 : val);
                                        }}
                                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-center font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                    <span className="font-bold text-sm text-slate-600">Horas límite</span>
                                </div>
                            )}
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