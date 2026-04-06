'use client'; // Agregamos esto para poder leer la ruta

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Nueva herramienta para saber dónde estamos
import { LayoutDashboard, QrCode, Settings, LogOut, Box, Package } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname(); // Acá leemos en qué pantalla está parado el usuario

    return (
        <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col font-sans">
            <div className="h-20 flex items-center px-8 border-b border-slate-800">
                <h1 className="text-2xl font-bold text-white tracking-tight">Simplik<span className="text-indigo-500">.</span></h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Principal</p>

                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </Link>

                <div className="pt-6 pb-2">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Herramientas</p>

                    <div className="space-y-3">
                        <Link href="/dashboard/tools/tool-1-QR" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-colors border border-indigo-600/20">
                            <QrCode size={20} />
                            <span className="font-medium">Catálogo QR</span>
                        </Link>

                        <Link href="/dashboard/tools/tool-2-pedidos" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                            <Package size={20} />
                            <span className="font-medium">Comandas Internas</span>
                        </Link>
                    </div>

                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 cursor-not-allowed mt-3">
                        <Box size={20} />
                        <span className="font-medium">Próximamente...</span>
                    </button>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                {/* ACÁ ESTÁ LA MAGIA: Le pasamos a configuraciones la ruta de donde venimos */}
                <Link href={`/dashboard/configuracion?from=${pathname}`} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Configuración</span>
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-left">
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}