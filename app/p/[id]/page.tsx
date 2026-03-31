'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Tag, ChevronLeft, ChevronRight, PlayCircle, ShieldCheck } from 'lucide-react';

export default function PaginaProductoPublico() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        async function fetchProduct() {
            const { data } = await supabase.from('products').select('*').eq('id', id).single();
            if (data) setProduct(data);
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
    if (!product) return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-bold">Producto no encontrado</p></div>;

    // Extraer ID de YouTube si hay un video
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Armar el arreglo del carrusel (Imagen + Video)
    const media = [];
    if (product.image_url) media.push({ type: 'image', url: product.image_url });
    if (product.video_url) {
        const ytId = getYoutubeId(product.video_url);
        if (ytId) media.push({ type: 'youtube', id: ytId });
        else media.push({ type: 'link', url: product.video_url }); // Por si es Drive u otro
    }
    // Si no hay nada, ponemos un placeholder
    if (media.length === 0) media.push({ type: 'image', url: 'https://via.placeholder.com/500x500?text=Sin+Imagen' });

    const nextSlide = () => setCurrentSlide((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? media.length - 1 : prev - 1));

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* CARRUSEL DE MEDIOS */}
            <div className="relative w-full aspect-square bg-slate-200 overflow-hidden shadow-sm">
                {media[currentSlide].type === 'image' && (
                    <img src={media[currentSlide].url} alt={product.name} className="w-full h-full object-cover animate-in fade-in duration-500" />
                )}

                {media[currentSlide].type === 'youtube' && (
                    <iframe
                        className="w-full h-full animate-in fade-in duration-500"
                        src={`https://www.youtube.com/embed/${media[currentSlide].id}?autoplay=0&controls=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                )}

                {media[currentSlide].type === 'link' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white p-6 text-center">
                        <PlayCircle size={60} className="mb-4 text-indigo-400" />
                        <p className="font-bold mb-4">Video disponible en enlace externo</p>
                        <a href={media[currentSlide].url} target="_blank" rel="noreferrer" className="bg-indigo-600 px-6 py-3 rounded-full font-bold text-sm">Ver Video</a>
                    </div>
                )}

                {/* Controles del Carrusel (Solo si hay más de 1 elemento) */}
                {media.length > 1 && (
                    <>
                        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg text-slate-800 hover:scale-110 transition-transform"><ChevronLeft size={24} /></button>
                        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg text-slate-800 hover:scale-110 transition-transform"><ChevronRight size={24} /></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {media.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${currentSlide === i ? 'bg-indigo-600 w-4' : 'bg-white/60'}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* INFO DEL PRODUCTO */}
            <div className="bg-white rounded-t-[2.5rem] -mt-8 relative z-10 p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">
                    <Tag size={12} /> Cód: {product.sku}
                </div>

                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{product.name}</h1>

                <div className="flex items-end gap-3 mb-8">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">${product.price_installments}</span>
                </div>

                {/* DESCRIPCIÓN */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-lg border-b pb-2">Descripción del Producto</h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {product.description || "No hay descripción detallada para este producto."}
                    </p>
                </div>

                {/* BADGE DE CONFIANZA */}
                <div className="mt-8 bg-slate-50 rounded-2xl p-5 flex items-start gap-4 border border-slate-100">
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">Información Verificada</h4>
                        <p className="text-xs text-slate-500 mt-1">Los datos y precios de este producto están actualizados y gestionados por Simplik.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}