'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, Play, Check, X, Flame, RefreshCw, RotateCcw, MessageSquareWarning, Send } from 'lucide-react';
import { obtenerPedidosActivosAction, actualizarEstadoPedidoAction, reportarProblemaAction } from '../actions';

export default function DepositoVentas() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Estados para el input de problema
    const [inputProblemaId, setInputProblemaId] = useState<string | null>(null);
    const [mensajeProblema, setMensajeProblema] = useState('');

    useEffect(() => {
        cargarPedidos();
        const radar = setInterval(cargarPedidos, 5000);
        return () => clearInterval(radar);
    }, []);

    const cargarPedidos = async () => {
        const res = await obtenerPedidosActivosAction();
        if (res.success && res.data) setPedidos(res.data);
    };

    const cambiarEstado = async (id: string, nuevoEstado: string) => {
        setLoadingId(id);
        await actualizarEstadoPedidoAction(id, nuevoEstado);
        await cargarPedidos();
        setLoadingId(null);
    };

    const enviarProblema = async (id: string) => {
        if (!mensajeProblema.trim()) return;
        setLoadingId(id);
        await reportarProblemaAction(id, mensajeProblema);
        setInputProblemaId(null);
        setMensajeProblema('');
        await cargarPedidos();
        setLoadingId(null);
    };

    const pendientes = pedidos.filter(p => p.estado === 'pendiente');
    // Ahora en esta columna conviven los que se están preparando y los pausados por consulta
    const preparacionesActivas = pedidos.filter(p => p.estado === 'preparando' || p.estado === 'pausado');
    const completados = pedidos.filter(p => p.estado === 'listo' || p.estado === 'rechazado').slice(0, 8);

    const TarjetaPedido = ({ ped, columna }: any) => {
        const isMultiple = ped.cantidad.includes('Ítems');
        const isPausado = ped.estado === 'pausado';

        return (
            <div className={`bg-white p-4 rounded-xl border-l-4 shadow-sm relative overflow-hidden transition-all ${isPausado ? 'border-l-amber-400 bg-amber-50/30' :
                ped.urgencia === 'urgente' ? 'border-l-red-500 shadow-md shadow-red-500/10' : 'border-l-indigo-500'
                }`}>
                {loadingId === ped.id && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <RefreshCw className="animate-spin text-indigo-500" size={20} />
                    </div>
                )}

                <div className="flex justify-between items-start mb-2.5">
                    {ped.urgencia === 'urgente' ? (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 animate-pulse">
                            <Flame size={10} /> URGENTE
                        </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Normal</span>
                    )}
                    <span className="text-[11px] font-bold text-slate-400">
                        {new Date(ped.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="flex items-start gap-2.5 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold mt-0.5 whitespace-nowrap ${isMultiple ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}`}>
                        {ped.cantidad}
                    </span>
                    <div className="flex-1 flex flex-col">
                        {ped.producto_pedido.split('\n').map((line: string, i: number) => {
                            if (!line.trim()) return null;
                            const isNote = line.includes('👉');
                            return (
                                <div key={i} className={`${isNote ? 'text-[11px] font-medium text-slate-500 italic mt-0.5 mb-1' : 'text-sm font-bold text-slate-800 leading-snug mt-0.5'}`}>
                                    {line}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {ped.notas && <p className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-1.5 rounded-md italic border border-slate-100 mb-2">Nota general: {ped.notas}</p>}

                {/* ZONA DE CONVERSACIÓN INTERNA */}
                {(ped.mensaje_deposito || ped.respuesta_salon) && (
                    <div className="mb-3 bg-amber-100/50 border border-amber-200 rounded-lg p-2.5 space-y-2">
                        {ped.mensaje_deposito && (
                            <div>
                                <span className="text-[9px] font-black uppercase text-amber-600 block mb-0.5">Depósito consultó:</span>
                                <p className="text-xs font-bold text-slate-700">{ped.mensaje_deposito}</p>
                            </div>
                        )}
                        {ped.respuesta_salon && (
                            <div className="border-t border-amber-200/50 pt-1.5">
                                <span className="text-[9px] font-black uppercase text-indigo-600 block mb-0.5">Local Respondió:</span>
                                <p className="text-xs font-bold text-slate-700">{ped.respuesta_salon}</p>
                            </div>
                        )}
                    </div>
                )}

                {columna === 'pendientes' && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <button onClick={() => cambiarEstado(ped.id, 'preparando')} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                            <Play size={12} /> Preparar
                        </button>
                        <button onClick={() => cambiarEstado(ped.id, 'rechazado')} className="bg-red-50 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                            <X size={12} /> Faltante
                        </button>
                    </div>
                )}

                {columna === 'preparando' && (
                    <div className="mt-3 flex flex-col gap-2">
                        {isPausado ? (
                            <div className="bg-amber-100 text-amber-700 text-xs font-bold py-2 rounded-lg text-center animate-pulse">
                                Esperando respuesta del salón...
                            </div>
                        ) : (
                            <>
                                {inputProblemaId === ped.id ? (
                                    <div className="flex gap-2">
                                        <input type="text" value={mensajeProblema} onChange={e => setMensajeProblema(e.target.value)} placeholder="Ej: No me queda M, mando S?" className="flex-1 px-2 py-1.5 text-xs border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20" autoFocus />
                                        <button onClick={() => enviarProblema(ped.id)} className="bg-amber-500 text-white p-1.5 rounded-lg hover:bg-amber-600"><Send size={14} /></button>
                                        <button onClick={() => setInputProblemaId(null)} className="bg-slate-100 text-slate-500 p-1.5 rounded-lg hover:bg-slate-200"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => cambiarEstado(ped.id, 'listo')} className="w-full bg-emerald-500 text-white hover:bg-emerald-600 px-2 py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-500/20 active:scale-95">
                                            <Check size={16} /> Listo / Despachar
                                        </button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => setInputProblemaId(ped.id)} className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                                                <MessageSquareWarning size={12} /> Consultar
                                            </button>
                                            <button onClick={() => cambiarEstado(ped.id, 'rechazado')} className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                                                <X size={12} /> Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {columna === 'completados' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase ${ped.estado === 'listo' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {ped.estado === 'listo' ? '✔ Entregado' : '✖ Cancelado'}
                        </span>
                        <button onClick={() => cambiarEstado(ped.id, 'pendiente')} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                            <RotateCcw size={12} /> Reactivar
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 font-sans text-slate-800 min-h-screen flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tools/tool-2-pedidos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Package className="text-emerald-600" size={24} /> Puesto: Depósito Central
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Radar Activo
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">

                <div className="bg-slate-100/60 rounded-[1.5rem] p-4 border border-slate-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-base font-black text-slate-700 uppercase flex items-center gap-2"><Clock size={18} className="text-orange-500" /> Nuevos</h2>
                        <span className="bg-orange-200 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full">{pendientes.length}</span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar pb-6">
                        {pendientes.length === 0 && <div className="text-center text-slate-400 text-xs mt-6 font-bold border-2 border-dashed border-slate-300 rounded-xl py-6">No hay pedidos nuevos.</div>}
                        {pendientes.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="pendientes" />)}
                    </div>
                </div>

                <div className="bg-slate-100/60 rounded-[1.5rem] p-4 border border-slate-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-base font-black text-slate-700 uppercase flex items-center gap-2"><Play size={18} className="text-blue-500" /> Preparando</h2>
                        <span className="bg-blue-200 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">{preparacionesActivas.length}</span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar pb-6">
                        {preparacionesActivas.length === 0 && <div className="text-center text-slate-400 text-xs mt-6 font-bold border-2 border-dashed border-slate-300 rounded-xl py-6">Nada en preparación.</div>}
                        {preparacionesActivas.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="preparando" />)}
                    </div>
                </div>

                <div className="bg-slate-100/60 rounded-[1.5rem] p-4 border border-slate-200 flex flex-col opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-base font-black text-slate-700 uppercase flex items-center gap-2"><Check size={18} className="text-emerald-500" /> Historial</h2>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar pb-6">
                        {completados.length === 0 && <div className="text-center text-slate-400 text-xs mt-6 font-bold border-2 border-dashed border-slate-300 rounded-xl py-6">Historial vacío.</div>}
                        {completados.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="completados" />)}
                    </div>
                </div>

            </div>
        </div>
    );
}