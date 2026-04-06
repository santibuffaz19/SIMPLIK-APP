'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, Play, Check, X, Flame, RefreshCw } from 'lucide-react';
import { obtenerPedidosActivosAction, actualizarEstadoPedidoAction } from '../actions';

export default function DepositoVentas() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);

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

    const pendientes = pedidos.filter(p => p.estado === 'pendiente');
    const preparando = pedidos.filter(p => p.estado === 'preparando');
    const completados = pedidos.filter(p => p.estado === 'listo' || p.estado === 'rechazado').slice(0, 8);

    const TarjetaPedido = ({ ped, columna }: any) => (
        <div className={`bg-white p-5 rounded-2xl border-l-4 shadow-sm relative overflow-hidden transition-all ${ped.urgencia === 'urgente' ? 'border-l-red-500' : 'border-l-indigo-500'}`}>
            {loadingId === ped.id && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-indigo-500" size={24} />
                </div>
            )}

            <div className="flex justify-between items-start mb-3">
                {ped.urgencia === 'urgente' ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                        <Flame size={12} /> URGENTE
                    </span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-black uppercase">
                        Normal
                    </span>
                )}
                <span className="text-xs font-bold text-slate-400">
                    {new Date(ped.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <h3 className="text-lg font-black text-slate-800 leading-tight mb-3 flex items-start gap-2">
                {/* CANTIDAD ESTILIZADA COMO BADGE */}
                <span className="bg-slate-800 text-white px-2 py-0.5 rounded-md text-sm mt-0.5 whitespace-nowrap">{ped.cantidad}</span>
                <span className="flex-1">{ped.producto_pedido}</span>
            </h3>

            {ped.notas && <p className="text-sm font-medium text-slate-600 bg-amber-50 p-2 rounded-lg italic border border-amber-100 mb-3">"{ped.notas}"</p>}

            {columna === 'pendientes' && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => cambiarEstado(ped.id, 'preparando')} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                        <Play size={14} /> Preparar
                    </button>
                    <button onClick={() => cambiarEstado(ped.id, 'rechazado')} className="bg-red-50 text-red-700 hover:bg-red-600 hover:text-white px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                        <X size={14} /> Sin Stock
                    </button>
                </div>
            )}

            {/* NUEVOS BOTONES DE ERROR EN LA COLUMNA PREPARANDO */}
            {columna === 'preparando' && (
                <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => cambiarEstado(ped.id, 'listo')} className="w-full bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-3 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-500/20 active:scale-95">
                        <Check size={18} /> Listo / Despachar
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => cambiarEstado(ped.id, 'pendiente')} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                            <ArrowLeft size={14} /> Atrás
                        </button>
                        <button onClick={() => cambiarEstado(ped.id, 'rechazado')} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors">
                            <X size={14} /> Cancelar
                        </button>
                    </div>
                </div>
            )}

            {columna === 'completados' && (
                <div className="mt-2 text-right">
                    <span className={`text-[10px] font-black uppercase ${ped.estado === 'listo' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {ped.estado === 'listo' ? '✔ Entregado' : '✖ Cancelado'}
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 font-sans text-slate-800 min-h-screen flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tools/tool-2-pedidos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Package className="text-emerald-600" /> Puesto: Depósito Central
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Radar Activo
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

                <div className="bg-slate-100/50 rounded-[2rem] p-5 border-2 border-slate-200 flex flex-col">
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h2 className="text-lg font-black text-slate-700 uppercase flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" /> Nuevos
                        </h2>
                        <span className="bg-orange-200 text-orange-800 text-xs font-black px-2.5 py-1 rounded-full">{pendientes.length}</span>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-10">
                        {pendientes.length === 0 && <div className="text-center text-slate-400 text-sm mt-10 font-bold border-2 border-dashed border-slate-300 rounded-2xl py-8">No hay pedidos nuevos.</div>}
                        {pendientes.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="pendientes" />)}
                    </div>
                </div>

                <div className="bg-slate-100/50 rounded-[2rem] p-5 border-2 border-slate-200 flex flex-col">
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h2 className="text-lg font-black text-slate-700 uppercase flex items-center gap-2">
                            <Play size={20} className="text-blue-500" /> Preparando
                        </h2>
                        <span className="bg-blue-200 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full">{preparando.length}</span>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-10">
                        {preparando.length === 0 && <div className="text-center text-slate-400 text-sm mt-10 font-bold border-2 border-dashed border-slate-300 rounded-2xl py-8">Nada en preparación.</div>}
                        {preparando.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="preparando" />)}
                    </div>
                </div>

                <div className="bg-slate-100/50 rounded-[2rem] p-5 border-2 border-slate-200 flex flex-col opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h2 className="text-lg font-black text-slate-700 uppercase flex items-center gap-2">
                            <Check size={20} className="text-emerald-500" /> Historial Reciente
                        </h2>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-10">
                        {completados.length === 0 && <div className="text-center text-slate-400 text-sm mt-10 font-bold border-2 border-dashed border-slate-300 rounded-2xl py-8">Historial vacío.</div>}
                        {completados.map(ped => <TarjetaPedido key={ped.id} ped={ped} columna="completados" />)}
                    </div>
                </div>

            </div>
        </div>
    );
}