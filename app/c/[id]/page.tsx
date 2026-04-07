'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Layers, BookOpenText } from 'lucide-react';
import Link from 'next/link';

export default function VisorColeccion() {
    const { id } = useParams();
    const [coleccion, setColeccion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [revistas, setRevistas] = useState<any[]>([]);

    useEffect(() => {
        async function fetchColeccion() {
            const { data, error } = await supabase.from('tool_catalog_collections').select('*').eq('id', id).single();
            if (!error && data) {
                setColeccion(data);
                try {
                    const parsedMags = JSON.parse(data.description || '[]');
                    setRevistas(parsedMags);
                } catch (e) { console.error("Error parseando revistas"); }
            }
            setLoading(false);
        }
        fetchColeccion();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-violet-600" size={40} /></div>;
    if (!coleccion) return <div className="flex h-screen items-center justify-center bg-slate-50 text-xl font-black text-slate-800">Colección no encontrada</div>;

    const coverBg = coleccion.cover_color || '#4f46e5';

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 selection:bg-violet-200">
            {/* Header minimalista */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: coverBg }}>
                            <Layers size={20} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-950 tracking-tighter">{coleccion.name}</h1>
                    </div>
                    <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{revistas.length} Revistas</span>
                </div>
            </header>

            {/* Espacio para el header fixed */}
            <div className="h-20"></div>

            <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    {revistas.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 shadow-sm flex flex-col items-center gap-4">
                            <Layers size={48} className="text-slate-300" />
                            <p className="font-bold text-lg">Esta colección no tiene revistas asignadas.</p>
                        </div>
                    ) : (
                        revistas.map((mag: any, i: number) => {
                            const magColor = mag.cover_color || '#0a0a0a';
                            return (
                                // Link pasando fromCollection para el botón volver
                                <Link href={`/r/${mag.id}?fromCollection=${id}`} key={i} className="group relative flex flex-col items-center">

                                    {/* Representación del Librito (3D sutil) */}
                                    <div className="relative w-full aspect-[3/4] max-w-[260px] transition-all duration-500 ease-out transform group-hover:-translate-y-3 group-hover:rotate-[-2deg] perspective-[2000px]">

                                        {/* Sombra proyectada */}
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/20 rounded-[50%] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {/* Tapa del libro */}
                                        <div className="absolute inset-0 rounded-r-xl rounded-l-sm overflow-hidden shadow-lg border border-black/10 origin-left transition-transform duration-500 ease-out group-hover:rotate-y-[-15deg]" style={{ backgroundColor: magColor, transformStyle: 'preserve-3d' }}>

                                            {/* Brillo de tapa dura */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/5"></div>

                                            {/* Lomo sutil */}
                                            <div className="absolute top-0 left-0 h-full w-2 bg-black/20 z-10 border-r border-black/10"></div>

                                            {/* Contenido de tapa */}
                                            <div className="flex flex-col items-center justify-center h-full p-6 text-center relative z-20">
                                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/15">
                                                    <BookOpenText size={24} className="text-white" />
                                                </div>
                                                <h3 className="text-white font-black text-xl md:text-2xl tracking-widest leading-snug uppercase overflow-hidden line-clamp-4" style={{ fontFamily: mag.font_family || 'Inter' }}>
                                                    {mag.cover_title || mag.name}
                                                </h3>
                                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-white/50 font-bold uppercase tracking-widest whitespace-nowrap">Click para abrir</span>
                                            </div>
                                        </div>

                                        {/* Hojas (efecto 3D lateral al hover) */}
                                        <div className="absolute top-[2%] right-[-10px] h-[96%] w-[12px] bg-slate-50 border border-slate-200 shadow-inner rounded-r-sm origin-left transition-transform duration-500 ease-out scale-x-0 group-hover:scale-x-100 group-hover:rotate-y-[-15deg] z-[-1]" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.02) 50%)', backgroundSize: '100% 2px' }}></div>
                                    </div>

                                    {/* Info debajo del libro */}
                                    <div className="mt-6 text-center max-w-[260px] w-full">
                                        <h4 className="font-extrabold text-slate-950 text-lg leading-tight group-hover:text-violet-700 transition-colors truncate">{mag.name}</h4>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5 bg-slate-200 px-3 py-1 rounded-full inline-block">Ver Catálogo 3D</p>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </main>

            <footer className="border-t border-slate-200 bg-white mt-20 py-8 px-6 text-center text-sm text-slate-500 font-medium">
                Catálogos Interactivos 3D por <span className="font-bold text-slate-800">Santi</span>. Todos los derechos reservados.
            </footer>
        </div>
    );
}