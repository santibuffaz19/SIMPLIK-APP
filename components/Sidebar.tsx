'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, QrCode, Settings, LogOut, Box, Package, Menu, X, BookOpen, Sparkles } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    if (pathname === '/dashboard') {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-5 left-4 z-50 p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-transform"
            >
                <Menu size={24} />
            </button>

            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* CORRECCIÓN: h-[100dvh] en vez de min-h-screen */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 h-[100dvh] bg-slate-900 text-slate-300 flex flex-col font-sans shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800 shrink-0">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Simplik<span className="text-indigo-500">.</span></h1>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Principal</p>

                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <div className="pt-6 pb-2">
                        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Herramientas</p>

                        <div className="space-y-3">
                            <Link href="/dashboard/tools/tool-1-QR" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-colors border border-indigo-600/20">
                                <QrCode size={20} />
                                <span className="font-medium">Catálogo QR</span>
                            </Link>

                            <Link href="/dashboard/tools/tool-2-pedidos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                                <Package size={20} />
                                <span className="font-medium">Comandas Internas</span>
                            </Link>

                            {/* NUEVO: TOOL 3 - CATÁLOGOS 3D */}
                            <Link href="/dashboard/tools/tool-3-catalogos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors border border-violet-500/20">
                                <BookOpen size={20} />
                                <span className="font-medium">Catálogos 3D</span>
                            </Link>

                            <Link href="/dashboard/tools/tool-4-ai" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                                <Sparkles size={20} />
                                <span className="font-medium">Sesiones IA</span>
                            </Link>
                        </div>

                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 cursor-not-allowed mt-3">
                            <Box size={20} />
                            <span className="font-medium">Próximamente...</span>
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2 shrink-0">
                    <Link href={`/dashboard/configuracion?from=${pathname}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <Settings size={20} />
                        <span className="font-medium">Configuración</span>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-left">
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
}