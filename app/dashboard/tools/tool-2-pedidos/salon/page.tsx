'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, Send, Flame, Minus, Plus, Clock, CheckCircle2, XCircle, RefreshCw, PackageSearch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { crearPedidoAction, obtenerPedidosActivosAction } from '../actions';

export default function SalonVentas() {
    const [productosCatalogo, setProductosCatalogo] = useState<any[]>([]);
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Formulario
    const [productoPedido, setProductoPedido] = useState('');
    const [cantidad, setCantidad] = useState(1);

    // NUEVOS ESTADOS PARA UNIDADES
    const [unidad, setUnidad] = useState('unidades');
    const [unidadCustom, setUnidadCustom] = useState('');

    const [urgencia, setUrgencia] = useState('normal');
    const [notas, setNotas] = useState('');

    useEffect(() => {
        async function fetchCatalogo() {
            const { data } = await supabase.from('products').select('name, sku').limit(200);
            if (data) setProductosCatalogo(data);
        }
        fetchCatalogo();
        cargarPedidos();

        const radar = setInterval(cargarPedidos, 5000);
        return () => clearInterval(radar);
    }, []);

    const cargarPedidos = async () => {
        setRefreshing(true);
        const res = await obtenerPedidosActivosAction();
        if (res.success && res.data) setPedidos(res.data);
        setRefreshing(false);
    };

    const handleEnviarPedido = async () => {
        if (!productoPedido || cantidad < 1) return alert('Completá qué producto necesitás.');

        // LÓGICA PARA UNIR NÚMERO Y TIPO DE MEDIDA
        let cantidadFinal = `${cantidad} ${unidad}`;
        if (unidad === 'otro') {
            if (!unidadCustom.trim()) return alert('Por favor, especificá la unidad de medida (Ej: Paquetes, Pallets...).');
            cantidadFinal = `${cantidad} ${unidadCustom.trim()}`;
        }

        setLoading(true);

        const res = await crearPedidoAction({
            producto_pedido: productoPedido,
            cantidad: cantidadFinal,
            urgencia,
            notas
        });

        if (res.success) {
            setProductoPedido('');
            setCantidad(1);
            setUnidad('unidades');
            setUnidadCustom('');
            setUrgencia('normal');
            setNotas('');
            cargarPedidos();
        } else {
            alert('Error al enviar: ' + res.error);
        }
        setLoading(false);
    };

    const getEstadoUI = (estado: string) => {
        switch (estado) {
            case 'pendiente': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <Clock size={16} />, texto: 'Enviado' };
            case 'preparando': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <RefreshCw size={16} className="animate-spin" />, texto: 'Preparando' };
            case 'listo': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={16} />, texto: 'Listo / En camino' };
            case 'rechazado': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={16} />, texto: 'Cancelado / Sin Stock' };
            default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: <Clock size={16} />, texto: estado };
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans text-slate-800">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tools/tool-2-pedidos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Store className="text-indigo-600" /> Puesto: Salón de Ventas
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    {refreshing ? <RefreshCw size={16} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                    Conexión en vivo
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* PANEL DE PEDIDO NUEVO */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-indigo-900/5">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Nueva Solicitud</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">¿Qué artículo falta?</label>
                                <input
                                    list="catalogo"
                                    type="text"
                                    value={productoPedido}
                                    onChange={(e) => setProductoPedido(e.target.value)}
                                    placeholder="Nombre o código del producto..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                                />
                                <datalist id="catalogo">
                                    {productosCatalogo.map((p, i) => <option key={i} value={p.sku ? `${p.sku} - ${p.name}` : p.name} />)}
                                </datalist>
                            </div>

                            {/* NUEVO: SELECTOR DE UNIDADES INTEGRADO */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad y Tipo</label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-1.5 w-full sm:w-auto">
                                        <button onClick={() => setCantidad(c => Math.max(1, c - 1))} className="p-3 bg-white shadow-sm hover:bg-slate-100 rounded-lg transition-colors"><Minus size={18} /></button>
                                        <div className="w-12 text-center font-black text-2xl">{cantidad}</div>
                                        <button onClick={() => setCantidad(c => c + 1)} className="p-3 bg-white shadow-sm hover:bg-slate-100 rounded-lg transition-colors"><Plus size={18} /></button>
                                    </div>

                                    <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full sm:flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-600">
                                        <option value="unidades">Unidades</option>
                                        <option value="metros">Metros</option>
                                        <option value="kilos">Kilos</option>
                                        <option value="litros">Litros</option>
                                        <option value="cajas">Cajas</option>
                                        <option value="rollos">Rollos</option>
                                        <option value="pares">Pares</option>
                                        <option value="otro">Agregar otra...</option>
                                    </select>
                                </div>

                                {/* INPUT MÁGICO SI ELIGEN "OTRO" */}
                                {unidad === 'otro' && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            value={unidadCustom}
                                            onChange={e => setUnidadCustom(e.target.value)}
                                            placeholder="Ej: Gramos, Paquetes, Pallets..."
                                            className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-indigo-800 placeholder:text-indigo-400"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nivel de Urgencia</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setUrgencia('normal')} className={`p-3 rounded-xl border-2 font-bold transition-all ${urgencia === 'normal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-indigo-200'}`}>
                                        Normal
                                    </button>
                                    <button onClick={() => setUrgencia('urgente')} className={`p-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${urgencia === 'urgente' ? 'border-red-500 bg-red-50 text-red-700 shadow-inner' : 'border-slate-200 text-slate-500 hover:border-red-200'}`}>
                                        <Flame size={18} /> Urgente
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Notas para el depósito (Opcional)</label>
                                <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: Cliente esperando en mostrador..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                            </div>

                            <button onClick={handleEnviarPedido} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4 active:scale-95">
                                {loading ? <RefreshCw size={22} className="animate-spin" /> : <Send size={22} />}
                                Hacer Pedido al Depósito
                            </button>
                        </div>
                    </div>
                </div>

                {/* PANEL DE HISTORIAL */}
                <div className="lg:col-span-7">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 h-full flex flex-col">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <PackageSearch className="text-slate-500" /> Radar de mis pedidos
                        </h2>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {pedidos.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 font-medium">No hiciste ningún pedido hoy.</div>
                            ) : (
                                pedidos.map((ped) => {
                                    const ui = getEstadoUI(ped.estado);
                                    return (
                                        <div key={ped.id} className={`bg-white p-5 rounded-2xl border-2 transition-all ${ui.border} ${ped.urgencia === 'urgente' && ped.estado === 'pendiente' ? 'shadow-md shadow-red-500/10' : 'shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 ${ui.bg} ${ui.color}`}>
                                                        {ui.icon} {ui.texto}
                                                    </span>
                                                    {ped.urgencia === 'urgente' && <span className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1"><Flame size={10} /> Urgente</span>}
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">
                                                    {new Date(ped.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 leading-tight flex items-center gap-2">
                                                {/* MODIFICADO PARA MOSTRAR TEXTO "10 Cajas" COMO BADGE */}
                                                <span className="bg-slate-800 text-white px-2 py-1 rounded-md text-sm whitespace-nowrap">{ped.cantidad}</span>
                                                {ped.producto_pedido}
                                            </h3>
                                            {ped.notas && <p className="text-sm font-medium text-slate-500 mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">"{ped.notas}"</p>}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}