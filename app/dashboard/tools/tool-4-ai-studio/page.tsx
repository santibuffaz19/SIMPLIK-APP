'use client';

import Link from 'next/link';
import { Camera, Video, History, Settings2, Sparkles, ArrowRight, Zap, ImageIcon, Film } from 'lucide-react';

export default function Tool4Hub() {
    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans text-slate-800 min-h-[85vh] flex flex-col">

            {/* Header */}
            <header className="mb-12 mt-10 md:mt-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-2.5 rounded-xl shadow-lg shadow-rose-500/25">
                        <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Sesiones IA</h1>
                        <p className="text-slate-500 font-medium text-sm">Generá fotos y videos profesionales de tus productos con inteligencia artificial.</p>
                    </div>
                </div>
            </header>

            {/* Main choice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

                {/* FOTOS */}
                <Link
                    href="/dashboard/tools/tool-4-ai/generador?tipo=foto"
                    className="group relative bg-slate-900 rounded-3xl p-8 md:p-10 overflow-hidden border border-slate-800 hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                            <Camera size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 group-hover:text-rose-300 transition-colors">
                            Sesión de Fotos
                        </h2>
                        <p className="text-slate-400 font-medium leading-relaxed mb-6">
                            Generá imágenes publicitarias de productos, ropa o comida con IA. Elegí fondo, pose, estilo y extras visuales.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['Producto', 'Moda', 'Comida'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest">
                            Generar Fotos <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* VIDEOS */}
                <Link
                    href="/dashboard/tools/tool-4-ai/generador?tipo=video"
                    className="group relative bg-slate-900 rounded-3xl p-8 md:p-10 overflow-hidden border border-slate-800 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                            <Film size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 group-hover:text-violet-300 transition-colors">
                            Sesión de Videos
                        </h2>
                        <p className="text-slate-400 font-medium leading-relaxed mb-6">
                            Generá clips cortos y profesionales de productos o moda con movimiento de cámara, interacción y formato a medida.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['Producto', 'Moda', 'Comida'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-violet-400 font-black text-xs uppercase tracking-widest">
                            Generar Videos <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/dashboard/tools/tool-4-ai/historial" className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <History size={20} className="text-slate-600 group-hover:text-white" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm">Historial de Generaciones</p>
                        <p className="text-xs text-slate-500 font-medium">Ver, descargar y regenerar resultados anteriores</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/dashboard/tools/tool-4-ai/configuracion" className="flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <Settings2 size={20} className="text-slate-600 group-hover:text-white" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm">Modelos Guardados</p>
                        <p className="text-xs text-slate-500 font-medium">Administrá modelos humanos reutilizables para moda</p>
                    </div>
                    <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>

            {/* Info note */}
            <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <strong>Importante:</strong> La generación de imágenes utiliza fal.ai y requiere tu API key configurada en las variables de entorno como <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">FAL_API_KEY</code>. Los videos pueden tardar entre 30 segundos y 2 minutos en procesarse.
                </p>
            </div>
        </div>
    );
}
