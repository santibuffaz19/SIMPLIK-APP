'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowLeft, Loader2, Printer, Eye, CheckCircle2, Circle, Upload, X } from 'lucide-react';
import Link from 'next/link';
import LabelPDF from '@/components/LabelPDF';
import { supabase } from '@/lib/supabase';

export default function PaginaEtiquetaFinal() {
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [qrBase64, setQrBase64] = useState('');
    const [loading, setLoading] = useState(true);

    const [width, setWidth] = useState<number | ''>(50);
    const [height, setHeight] = useState<number | ''>(25);

    const [debouncedWidth, setDebouncedWidth] = useState(50);
    const [debouncedHeight, setDebouncedHeight] = useState(25);

    const [layout, setLayout] = useState('qr-right');
    const [showPrice, setShowPrice] = useState(true);
    const [showSku, setShowSku] = useState(true);
    const [showName, setShowName] = useState(true);
    const [showPromo, setShowPromo] = useState(false);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [promoText, setPromoText] = useState('PROMO');
    const [extraNote, setExtraNote] = useState('');

    const hasContent = showName || showPrice || showSku || logoBase64 || showPromo || extraNote;

    useEffect(() => {
        async function fetchProduct() {
            const { data } = await supabase.from('products').select('*').eq('id', id).single();
            if (data) {
                setProduct(data);
                const b64 = await QRCode.toDataURL(`${window.location.origin}/p/${data.id}`, { margin: 1 });
                setQrBase64(b64);
            }
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // LÍMITES DE SEGURIDAD PARA PDF (Mínimos: 25x15)
            const w = Number(width);
            const h = Number(height);
            setDebouncedWidth(w >= 25 ? w : (w === 0 ? 50 : 25));
            setDebouncedHeight(h >= 15 ? h : (h === 0 ? 25 : 15));
        }, 800);
        return () => clearTimeout(timer);
    }, [width, height]);

    const handleLogoUpload = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoBase64(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const Toggle = ({ active, label, onClick }: any) => (
        <button onClick={onClick} className="flex items-center gap-3 group py-1 cursor-pointer transition-all">
            <div className={`transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {active ? <CheckCircle2 size={20} className="text-indigo-600" /> : <Circle size={20} className="text-slate-300" />}
            </div>
            <span className={`text-sm font-bold transition-colors ${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}>{label}</span>
        </button>
    );

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    // LÓGICA DE ESCALADO DE PREVISUALIZACIÓN
    const scaleFactorPrevis = 3.8;
    const wPrevis = Number(width) || 50;
    const hPrevis = Number(height) || 25;

    // Medidas "seguras" para la preview visual
    const safeW = Math.max(25, wPrevis);
    const safeH = Math.max(15, hPrevis);

    // Cálculo de factor de escala base interno (basado en la proporción 50x25)
    const normalizedW = safeW / 50;
    const normalizedH = safeH / 25;
    const innerScale = Math.min(normalizedW, normalizedH);

    // Tamaños de fuente responsivos para la preview
    const fontSizeTitlePrevis = Math.max(4, 7 * innerScale) * scaleFactorPrevis;
    const fontSizePricePrevis = Math.max(6, 14 * innerScale) * scaleFactorPrevis;
    const fontSizeNotePrevis = Math.max(2, 4 * innerScale) * scaleFactorPrevis;
    const fontSizePromoPrevis = Math.max(3, 5 * innerScale) * scaleFactorPrevis;

    // Padding responsivo
    const paddingPrevis = Math.max(1.5, 3 * innerScale) * scaleFactorPrevis;

    return (
        <div className="max-w-6xl mx-auto p-8 font-sans text-slate-800 antialiased overflow-x-hidden">
            <Link href="/dashboard/productos" className="inline-flex items-center gap-2 text-slate-400 mb-8 hover:text-indigo-600 hover:-translate-x-1 transition-all font-black uppercase text-[10px] tracking-widest">
                <ArrowLeft size={14} /> Volver al catálogo
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 space-y-10">
                    <header>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Motor de Etiquetas</h1>
                        <p className="text-slate-400 font-medium text-lg italic">Personalizá la impresión para {product.name}.</p>
                    </header>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-10">
                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase mb-4">ANCHO (mm) <span className="text-red-500">*</span></h2>
                                <input
                                    type="number"
                                    value={width}
                                    min="25"
                                    onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Min 25mm"
                                    required
                                    className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xl focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {width && Number(width) < 25 && <p className="text-red-500 text-xs mt-1">Mínimo 25mm</p>}
                            </div>
                            <div>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase mb-4">ALTO (mm) <span className="text-red-500">*</span></h2>
                                <input
                                    type="number"
                                    value={height}
                                    min="15"
                                    onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Min 15mm"
                                    required
                                    className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-xl focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {height && Number(height) < 15 && <p className="text-red-500 text-xs mt-1">Mínimo 15mm</p>}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-[11px] font-black text-slate-400 uppercase mb-5">UBICACIÓN DEL QR</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {[{ id: 'qr-left', l: 'IZQUIERDA' }, { id: 'qr-center', l: 'CENTRO' }, { id: 'qr-right', l: 'DERECHA' }].map(pos => (
                                    <button key={pos.id} onClick={() => setLayout(pos.id)} className={`p-4 rounded-2xl border-2 font-black text-[10px] transition-all hover:shadow-md ${layout === pos.id ? 'border-indigo-600 bg-indigo-600 text-white translate-y-[-2px]' : 'border-slate-100 text-slate-400 bg-slate-50 hover:border-slate-200 hover:text-slate-600'}`}>{pos.l}</button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Visibilidad</h2>
                                <Toggle active={showName} label="Nombre" onClick={() => setShowName(!showName)} />
                                <Toggle active={showPrice} label="Precio" onClick={() => setShowPrice(!showPrice)} />
                                <Toggle active={showSku} label="Código" onClick={() => setShowSku(!showSku)} />
                                <Toggle active={showPromo} label="Promo" onClick={() => setShowPromo(!showPromo)} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Textos Adicionales</h2>
                                <input type="text" value={extraNote} onChange={e => setExtraNote(e.target.value)} placeholder="Nota al pie..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white transition-all outline-none" />
                                {showPromo && <input type="text" value={promoText} onChange={e => setPromoText(e.target.value)} className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-sm font-bold text-indigo-700 outline-none animate-in fade-in zoom-in" />}
                            </div>
                        </div>

                        <div className="pt-10 border-t border-slate-100">
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Logo de Empresa</h2>
                            {!logoBase64 ? (
                                <label className="flex items-center justify-center gap-3 w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all group">
                                    <Upload size={20} className="group-hover:bounce" />
                                    <span className="font-bold text-sm">Seleccionar Imagen</span>
                                    <input type="file" onChange={handleLogoUpload} className="hidden" />
                                </label>
                            ) : (
                                <div className="relative inline-block group">
                                    <img src={logoBase64} className="h-16 w-auto rounded-xl border p-2 bg-slate-50" />
                                    <button
                                        onClick={() => setLogoBase64(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="sticky top-8 space-y-8">
                        <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative group overflow-hidden">
                            <div className="flex items-center justify-center gap-3 mb-10 text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em]"><Eye size={12} /> Previsualización</div>

                            <div className="flex justify-center mb-12 relative overflow-hidden">
                                {/* Contenedor de la Previsualización Responsiva */}
                                <div style={{ width: safeW * scaleFactorPrevis, height: safeH * scaleFactorPrevis, padding: paddingPrevis }} className={`bg-white text-black flex items-center border-4 border-white/5 transition-all duration-300 shadow-2xl overflow-hidden ${!hasContent
                                    ? (layout === 'qr-left' ? 'justify-start' : (layout === 'qr-right' ? 'justify-end' : 'justify-center'))
                                    : 'justify-center'
                                    }`}>

                                    {layout === 'qr-center' && hasContent ? (
                                        <div className="flex w-full h-full items-center relative gap-1">
                                            {/* Panel Izquierdo */}
                                            <div className="w-[33%] h-full flex flex-col items-start justify-center text-left overflow-hidden leading-none gap-0.5">
                                                {logoBase64 && <img src={logoBase64} style={{ height: fontSizeTitlePrevis * 1.5 }} className="w-auto object-contain mb-1" />}
                                                {showName && <span style={{ fontSize: fontSizeTitlePrevis }} className="font-bold uppercase break-words w-full leading-tight">{product.name}</span>}
                                                {showPrice && <span style={{ fontSize: fontSizePricePrevis }} className="font-black tracking-tighter leading-none">${product.price_installments}</span>}
                                            </div>
                                            {/* Panel Central (QR) */}
                                            <div className="w-[33%] h-full flex items-center justify-center shrink-0">
                                                {qrBase64 && <img src={qrBase64} className="h-full w-full object-contain" />}
                                            </div>
                                            {/* Panel Derecho */}
                                            <div className="w-[33%] h-full flex flex-col items-end justify-center text-right overflow-hidden leading-none gap-0.5 pt-1">
                                                {showSku && <span style={{ fontSize: fontSizeNotePrevis, opacity: 0.6 }} className="font-black uppercase tracking-widest">{product.sku}</span>}
                                                {showPromo && <span style={{ fontSize: fontSizePromoPrevis, padding: '1px 3px' }} className="bg-black text-white rounded font-black uppercase">{promoText || 'PROMO'}</span>}
                                                {extraNote && <span style={{ fontSize: fontSizeNotePrevis, opacity: 0.6 }} className="w-full break-words">{extraNote}</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`flex w-full h-full items-center gap-1.5 ${layout === 'qr-left' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {hasContent && (
                                                <div className={`flex-1 h-full flex flex-col justify-center overflow-hidden gap-0.5 ${layout === 'qr-right' ? 'items-start text-left' : 'items-end text-right'}`}>
                                                    {logoBase64 && <img src={logoBase64} style={{ height: fontSizeTitlePrevis * 2 }} className="w-auto object-contain mb-2" />}
                                                    {showName && <span style={{ fontSize: fontSizeTitlePrevis * 1.1 }} className="font-bold leading-tight uppercase w-full break-words">{product.name}</span>}
                                                    {showPrice && <span style={{ fontSize: fontSizePricePrevis * 1.2 }} className="font-black tracking-tighter leading-none">${product.price_installments}</span>}
                                                    {showSku && <span style={{ fontSize: fontSizeNotePrevis, opacity: 0.6, marginTop: '2px' }} className="font-black uppercase tracking-widest">{product.sku}</span>}
                                                    {extraNote && <span style={{ fontSize: fontSizeNotePrevis, opacity: 0.6, marginTop: '2px' }} className="w-full break-words">{extraNote}</span>}
                                                    {showPromo && <span style={{ fontSize: fontSizePromoPrevis, padding: '2px 4px', marginTop: '4px' }} className="bg-black text-white rounded font-black uppercase">{promoText || 'PROMO'}</span>}
                                                </div>
                                            )}
                                            {/* Contenedor del QR */}
                                            <div style={{ width: hasContent ? '42%' : '80%' }} className="h-full flex items-center justify-center shrink-0">
                                                {qrBase64 && <img src={qrBase64} style={{ height: '100%' }} className="object-contain" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* EL COMPONENTE PDF RECIBE VALORES CON "RETRASO" Y GARANTIZADOS MIN 25X15 */}
                            {product && (
                                <PDFDownloadLink
                                    document={<LabelPDF productName={product.name} price={product.price_installments} sku={product.sku} qrCodeData={qrBase64} widthMm={debouncedWidth} heightMm={debouncedHeight} layout={layout} showPrice={showPrice} showSku={showSku} showName={showName} logoBase64={logoBase64} promoText={showPromo ? promoText : ''} extraNote={extraNote} />}
                                    fileName={`simplik-${product.name}.pdf`}
                                    className="flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-3xl transition-all shadow-xl uppercase text-xs tracking-widest active:scale-95"
                                >
                                    {({ loading }) => (
                                        <>
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
                                            {loading ? 'Generando PDF...' : 'Descargar PDF'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}