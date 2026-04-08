import Link from 'next/link';
import { QrCode, Package, ArrowRight, Settings, LayoutGrid, Lock, BookOpen, Sparkles } from 'lucide-react';

export default function DashboardHome() {
    return (
        <div className="max-w-6xl mx-auto p-8 font-sans min-h-[80vh] flex flex-col">

            {/* HEADER CON BOTÓN DE CONFIGURACIÓN ARRIBA A LA DERECHA */}
            <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm">
                            <LayoutGrid size={24} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bienvenido a Simplik</h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg md:ml-14">Seleccioná la herramienta con la que vas a trabajar hoy.</p>
                </div>

                {/* BOTÓN DE CONFIGURACIÓN */}
                <Link href="/dashboard/configuracion?from=/dashboard" className="inline-flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:text-indigo-400 hover:border-indigo-800 hover:shadow-sm transition-all active:scale-95 w-fit">
                    <Settings size={18} />
                    Ajustes del Sistema
                </Link>
            </header>

            {/* GRID DE HERRAMIENTAS - DISEÑO CLEAN Y PROFESIONAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">

                {/* TOOL 1: CATÁLOGO QR */}
                <Link href="/dashboard/tools/tool-1-QR" className="relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="bg-slate-800 border border-slate-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:border-indigo-700 transition-colors duration-300 relative">
                        <QrCode size={30} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 group-hover:text-indigo-400 transition-colors relative">Catálogo QR</h2>
                    <p className="text-slate-300 mb-8 font-medium leading-relaxed flex-1 relative">
                        Gestioná tus productos, generá etiquetas PDF y actualizá tu vidriera digital en minutos.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity relative">
                        Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </Link>

                {/* TOOL 2: COMANDAS */}
                <Link href="/dashboard/tools/tool-2-pedidos" className="relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="bg-slate-800 border border-slate-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:border-emerald-700 transition-colors duration-300 relative">
                        <Package size={30} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors relative">Comandas Internas</h2>
                    <p className="text-slate-300 mb-8 font-medium leading-relaxed flex-1 relative">
                        Solicitá stock desde el salón y gestioná la preparación en el depósito en tiempo real.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity relative">
                        Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </Link>

                {/* TOOL 3: CATÁLOGOS 3D */}
                <Link href="/dashboard/tools/tool-3-catalogos" className="relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full overflow-hidden">
                    <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="bg-slate-800 border border-slate-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:border-violet-700 transition-colors duration-300 relative">
                        <BookOpen size={30} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 group-hover:text-violet-400 transition-colors relative">Catálogos 3D</h2>
                    <p className="text-slate-300 mb-8 font-medium leading-relaxed flex-1 relative">
                        Creá revistas interactivas (Lookbooks) con tus productos para enviarle a tus clientes.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-violet-400 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity relative">
                        Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </Link>

                {/* TOOL 4: SESIONES IA */}
                <Link href="/dashboard/tools/tool-4-ai" className="relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full overflow-hidden">
                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="bg-slate-800 border border-slate-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:border-rose-700 transition-colors duration-300 relative">
                        <Sparkles size={30} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3 group-hover:text-rose-400 transition-colors relative">Sesiones IA</h2>
                    <p className="text-slate-300 mb-8 font-medium leading-relaxed flex-1 relative">
                        Generá fotos y videos profesionales de tus productos con inteligencia artificial. Fondos, poses, estilos y más.
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity relative">
                        Abrir Herramienta <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                </Link>

            </div>
        </div>
    );
}