'use client';

import Link from 'next/link';
import { Store, Package, ArrowRight } from 'lucide-react';

export default function ToolPedidosHub() {
    return (
        <div className="max-w-5xl mx-auto p-8 font-sans text-slate-800 h-[80vh] flex flex-col justify-center">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Comandas Internas</h1>
                <p className="text-slate-500 font-medium text-xl">¿Desde qué sector estás usando el sistema ahora?</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">

                {/* BOTÓN SALÓN */}
                <Link href="/dashboard/tools/tool-2-pedidos/salon" className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-indigo-500 transition-all group flex flex-col items-center text-center">
                    <div className="bg-indigo-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                        <Store size={48} className="text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3">Salón de Ventas</h2>
                    <p className="text-slate-500 mb-8 font-medium">Pedí mercadería al depósito de forma rápida y con alertas de urgencia.</p>
                    <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        Entrar como Salón <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* BOTÓN DEPÓSITO */}
                <Link href="/dashboard/tools/tool-2-pedidos/deposito" className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-emerald-500 transition-all group flex flex-col items-center text-center">
                    <div className="bg-emerald-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                        <Package size={48} className="text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3">Depósito</h2>
                    <p className="text-slate-500 mb-8 font-medium">Recibí pedidos en tiempo real, prepará la mercadería y avisá cuando esté lista.</p>
                    <div className="mt-auto flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        Entrar como Depósito <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

            </div>
        </div>
    );
}