'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Loader2, Tag, PlayCircle, ShieldCheck, Banknote, CreditCard, ListTree, Info, PlusCircle, ExternalLink, X, MessageCircle
} from 'lucide-react';

export default function PaginaProductoPublico() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // ESTADOS PARA LA CONFIGURACIÓN GLOBAL Y DE TOOLS
    const [companySettings, setCompanySettings] = useState<any>(null);
    const [toolSettings, setToolSettings] = useState<any>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchData() {
            // 1. Buscamos el producto
            const { data: prodData } = await supabase.from('products').select('*').eq('id', id).single();
            if (prodData) setProduct(prodData);

            // 2. Buscamos la configuración global de la empresa
            const { data: settingsData } = await supabase.from('company_settings').select('*').eq('id', 1).single();
            if (settingsData) setCompanySettings(settingsData);

            // 3. Buscamos la configuración del Catálogo QR (Para saber si ocultar precios)
            const { data: tsData } = await supabase.from('tool_qr_settings').select('*').eq('id', 1).single();
            if (tsData) setToolSettings(tsData);

            setLoading(false);
        }
        fetchData();
    }, [id]);

    if (loading) return <div className="flex h-[100dvh] w-full items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={64} /></div>;
    if (!product) return <div className="flex h-[100dvh] w-full items-center justify-center bg-white"><p className="text-slate-500 font-black text-3xl">Producto no encontrado</p></div>;

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const media: any[] = [];

    if (product.image_urls && product.image_urls.length > 0) {
        product.image_urls.forEach((url: string) => media.push({ type: 'image', url }));
    }

    if (product.external_link) {
        const ytId = getYoutubeId(product.external_link);
        if (ytId) {
            media.push({ type: 'youtube', id: ytId });
        } else {
            media.push({ type: 'external_video', url: product.external_link });
        }
    }

    if (media.length === 0) media.push({ type: 'image', url: 'https://placehold.co/800x600/e2e8f0/94a3b8?text=Sin+Imagen' });

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollPosition = scrollRef.current.scrollLeft;
            const slideWidth = scrollRef.current.offsetWidth;
            const newSlide = Math.round(scrollPosition / slideWidth);
            if (newSlide !== currentSlide) setCurrentSlide(newSlide);
        }
    };

    const hasCash = product.price_cash != null && product.price_cash > 0;
    const hasCard = product.price_installments != null && product.price_installments > 0;

    const extraPrices = [];
    if (product.custom_price_1_name && product.custom_price_1_value > 0) {
        extraPrices.push({ name: product.custom_price_1_name, value: product.custom_price_1_value });
    }
    if (product.custom_price_2_name && product.custom_price_2_value > 0) {
        extraPrices.push({ name: product.custom_price_2_name, value: product.custom_price_2_value });
    }

    // VERIFICACIÓN: ¿Mostramos el logo de la empresa?
    const showBusinessLogo = companySettings?.business_logo_url &&
        companySettings?.show_logo_globally &&
        product?.show_owner_logo_this_product !== false;

    // VARIABLES DE PERSONALIZACIÓN
    const brandColor = companySettings?.brand_color || '#4f46e5';
    const currency = companySettings?.currency_symbol || '$';
    const showPrices = toolSettings?.default_show_price !== false; // Si está false, modo mayorista activo

    // LINK WHATSAPP
    const waLink = companySettings?.whatsapp_number
        ? `https://wa.me/${companySettings.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hola! Quería consultar por el producto: ${product.name} (Cód: ${product.sku || 'N/A'})`
        : null;

    return (
        <div className="w-full bg-slate-100 font-sans flex flex-col min-h-[100dvh] selection:bg-indigo-200 overflow-x-hidden relative pb-10">
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* CARRUSEL */}
            <div className="relative w-full h-[35vh] bg-slate-200 shrink-0 py-3">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar px-4 gap-4"
                >
                    {media.map((item, i) => (
                        <div key={i} className="flex-none w-full h-full snap-center relative">
                            <div className="w-full h-full bg-white rounded-[2rem] shadow-lg border-2 border-slate-300 overflow-hidden flex items-center justify-center p-2">
                                {item.type === 'image' && (
                                    <img
                                        src={item.url}
                                        alt={`Slide ${i}`}
                                        className="w-full h-full object-contain rounded-[1.5rem] cursor-pointer"
                                        onClick={() => setZoomedImage(item.url)}
                                    />
                                )}
                                {item.type === 'youtube' && (
                                    <iframe className="w-full h-full rounded-[1.5rem]" src={`https://www.youtube.com/embed/${item.id}?autoplay=0&controls=1`} allowFullScreen></iframe>
                                )}
                                {item.type === 'external_video' && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white text-center hover:bg-slate-800 transition-colors rounded-[1.5rem]">
                                        <div className="bg-indigo-500/20 p-5 rounded-full mb-3 animate-pulse">
                                            <ExternalLink size={64} className="text-indigo-400" />
                                        </div>
                                        <h3 className="text-3xl font-black mb-2">Ver Archivo</h3>
                                        <p className="text-lg text-slate-400 font-bold">Toca para abrir link externo</p>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {media.length > 1 && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full z-20">
                        {media.map((_, i) => (
                            <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-white w-8' : 'bg-white/50 w-2.5'}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* CONTENEDOR DE INFORMACIÓN */}
            <div className="flex-1 w-full flex flex-col px-5 pt-8 pb-8 bg-white rounded-t-[2.5rem] -mt-5 relative z-10 shadow-[0_-12px_25px_rgba(0,0,0,0.08)]">

                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex justify-between items-center">
                        {product.category && (
                            <span style={{ backgroundColor: `${brandColor}15`, color: brandColor }} className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
                                {product.category}
                            </span>
                        )}
                        {product.sku && (
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Tag size={16} /> COD: {product.sku}
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-slate-950 leading-tight tracking-tight">{product.name}</h1>
                    {product.description && (
                        <p className="text-base text-slate-600 font-bold leading-snug mt-1 whitespace-pre-wrap">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* BLOQUE DE PRECIOS CONDICIONAL (MODO MAYORISTA) */}
                {showPrices && (
                    <>
                        <div className={`grid gap-3 mb-3 ${hasCash && hasCard ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {hasCash && (
                                <div className="bg-emerald-50 rounded-[2rem] p-5 border-2 border-emerald-200 flex flex-col justify-center items-center text-center shadow-sm">
                                    <span className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <Banknote size={18} /> Efectivo
                                    </span>
                                    <span className="text-4xl font-black text-emerald-600 tracking-tighter leading-none">{currency}{product.price_cash}</span>
                                </div>
                            )}

                            {hasCard && (
                                <div className="bg-slate-50 rounded-[2rem] p-5 border-2 border-slate-200 flex flex-col justify-center items-center text-center shadow-sm">
                                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <CreditCard size={18} /> Lista
                                    </span>
                                    <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{currency}{product.price_installments}</span>
                                </div>
                            )}
                        </div>

                        {extraPrices.length > 0 && (
                            <div className="flex flex-col gap-3 mb-6">
                                {extraPrices.map((ep, idx) => (
                                    <div key={idx} className="bg-indigo-50/50 rounded-2xl p-4 border-2 border-indigo-100 flex justify-between items-center shadow-sm">
                                        <span className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                                            <PlusCircle size={18} className="text-indigo-400" /> {ep.name}
                                        </span>
                                        <span className="text-3xl font-black text-indigo-700 tracking-tighter leading-none">{currency}{ep.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                {extraPrices.length === 0 && <div className="mb-6"></div>}

                {product.variants_config && product.variants_config.length > 0 && (
                    <div className="mb-6 flex flex-col gap-3">
                        {product.variants_config.map((variante: any) => (
                            <div key={variante.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                                <span className="text-sm font-black text-slate-500 uppercase shrink-0"><ListTree size={18} className="inline mr-1 text-indigo-400" /> {variante.nombre}:</span>
                                <div className="flex flex-wrap gap-2.5">
                                    {variante.valores.split(',').map((val: string, index: number) => (
                                        <span key={index} className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-lg font-black border-2 border-indigo-100 shadow-sm leading-none">
                                            {val.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {product.technical_specs && product.technical_specs.length > 0 && (
                    <div className="mb-4">
                        <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                            {product.technical_specs.map((spec: any, index: number) => (
                                <div key={spec.id} className={`flex justify-between items-center py-4 px-5 ${index !== product.technical_specs.length - 1 ? 'border-b-2 border-slate-200/50' : ''}`}>
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2"><Info size={16} className="text-indigo-400" /> {spec.clave}</span>
                                    <span className="text-xl font-black text-slate-950 text-right">{spec.valor}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- NUEVA SECCIÓN DE INTEGRACIONES Y MARCA CON ESTILO PERSONALIZADO --- */}
                <div className="mt-12 flex flex-col items-center justify-center gap-6">

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {/* BOTÓN DE WHATSAPP CON BRAND COLOR */}
                        {waLink && (
                            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ borderColor: brandColor, color: brandColor }} className="flex items-center justify-center gap-2 bg-white border shadow-sm hover:shadow-md transition-all px-6 py-3 rounded-full active:scale-95">
                                <MessageCircle size={18} style={{ color: brandColor }} />
                                <span className="text-xs font-black uppercase tracking-widest">Consultar</span>
                            </a>
                        )}

                        {/* BOTÓN DE INSTAGRAM CON BRAND COLOR */}
                        {companySettings?.instagram_url && (
                            <a href={companySettings.instagram_url} target="_blank" rel="noopener noreferrer" style={{ borderColor: brandColor, color: brandColor }} className="flex items-center justify-center gap-2 bg-white border shadow-sm hover:shadow-md transition-all px-6 py-3 rounded-full active:scale-95">
                                <Instagram size={18} style={{ color: brandColor }} />
                                <span className="text-xs font-black uppercase tracking-widest">Instagram</span>
                            </a>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        {/* LOGO DE LA EMPRESA */}
                        {showBusinessLogo ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 opacity-60">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catálogo de {companySettings?.company_name || 'Empresa'}</span>
                                <img src={companySettings.business_logo_url} alt="Logo Empresa" className="max-h-12 max-w-[150px] object-contain grayscale-[20%]" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 opacity-50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catálogo de {companySettings?.company_name || 'Empresa'}</span>
                            </div>
                        )}

                        {/* FOOTER VERIFICADO (Simplik) */}
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <ShieldCheck size={18} className="text-indigo-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Verificado por Simplik</span>
                        </div>
                    </div>
                </div>

            </div>

            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 z-50 text-white bg-white/20 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setZoomedImage(null)}
                    >
                        <X size={28} />
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Zoomed"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}