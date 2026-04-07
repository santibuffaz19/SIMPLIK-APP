'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Layers, ExternalLink } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 selection:bg-violet-200">
            <div className="relative pt-20 pb-16 px-4 md:px-8 text-center overflow-hidden" style={{ backgroundColor: coleccion.cover_color || '#4f46e5' }}>
                <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/20">
                        <Layers size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">{coleccion.name}</h1>
                    <p className="text-white/80 font-medium text-lg max-w-2xl mx-auto">Elegí la revista que querés explorar de esta colección.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {revistas.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 shadow-sm">
                            <p className="font-bold">Esta colección no tiene revistas asignadas.</p>
                        </div>
                    ) : (
                        revistas.map((mag: any, i: number) => (
                            <Link href={`/r/${mag.id}`} key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-2">
                                <div className="h-48 flex items-center justify-center p-6 relative transition-transform duration-500 group-hover:scale-105" style={{ backgroundColor: mag.cover_color || '#0a0a0a' }}>
                                    <h3 className="text-white font-black text-2xl text-center z-10 uppercase tracking-widest leading-tight line-clamp-3">{mag.cover_title || mag.name}</h3>
                                </div>
                                <div className="p-6 flex-1 flex flex-col bg-white relative z-10">
                                    <h4 className="font-bold text-slate-900 text-xl mb-6">{mag.name}</h4>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ver Catálogo</span>
                                        <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                            <ExternalLink size={18} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}