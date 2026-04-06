'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, QrCode, ArrowRight, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function ConfiguracionContent() {
    const searchParams = useSearchParams();

    // Leemos de dónde viene. Si no dice nada, asumimos que viene del dashboard.
    let fromPage = searchParams.get('from') || '/dashboard';

    // ESCUDO ANTI-BUCLES: Si por algún motivo "from" es otra página de configuración, forzamos la salida al dashboard
    if (fromPage.includes('/configuracion')) {
        fromPage = '/dashboard';
    }

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans text-slate-800">

            <div className="mb-6">
                <Link
                    href={fromPage}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow"
                >
                    <ArrowLeft size={16} /> Volver atrás
                </Link>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Ajustes del Sistema</h1>
                <p className="text-slate-500 font-medium text-lg">Administrá la configuración global y de cada herramienta.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/configuracion/general" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full">
                    <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Building2 size={28} className="text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">General (Empresa)</h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Logo de la marca, nombre comercial, WhatsApp y ajustes globales del negocio.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest">
                        Configurar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link href="/dashboard/tools/tool-1-QR/configuracion" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col h-full">
                    <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <QrCode size={28} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Catálogo QR</h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Ajustes de las etiquetas PDF, medidas por defecto y preferencias del motor QR.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest">
                        Configurar <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default function ConfiguracionHub() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-500">Cargando menú...</div>}>
            <ConfiguracionContent />
        </Suspense>
    );
}