'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowLeft, Loader2, Printer, Eye, CheckCircle2, Circle, Upload, X } from 'lucide-react';
import Link from 'next/link';
import LabelPDF from '../../components/LabelPDF';
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
        async function fetchData() {
            const { data: prodData } = await supabase.from('products').select('*').eq('id', id).single();
            if (prodData) {
                setProduct(prodData);
                const b64 = await QRCode.toDataURL(`${window.location.origin}/p/${prodData.id}`, { margin: 1 });
                setQrBase64(b64);
            }

            const { data: settingsData } = await supabase.from('tool_qr_settings').select('*').eq('id', 1).single();
            if (settingsData) {
                setWidth(settingsData.default_width_mm || 50);
                setHeight(settingsData.default_height_mm || 25);
                setDebouncedWidth(settingsData.default_width_mm || 50);
                setDebouncedHeight(settingsData.default_height_mm || 25);
                setLayout(settingsData.default_layout || 'qr-right');
            }
            setLoading(false);
        }
        fetchData();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const w = Number(width);
            const h = Number(height);
            setDebouncedWidth(w > 10 ? w : 50);
            setDebouncedHeight(h > 10 ? h : 25);
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

    const w = Number(width) || 50;
    const h = Number(height) || 25;
    const scale = Math.min(w / 50, h / 25);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans text-slate-800 antialiased overflow-x-hidden">
            <Link href="/dashboard/tools/tool-1-QR" className="inline-flex items-center gap-2 text-slate-400 mb-8 mt-12 md:mt-0 ml-4 md:ml-0 hover:text-indigo-600 hover:-translate-x-1 transition-all font-black uppercase text-[10px] tracking-widest">
                <ArrowLeft size={14} /> Volver al catálogo
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                <div className="lg:col-span-7 space-y-8 md:space-y-10">
                    <header className="px-2 md:px-0">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">Motor de Etiquetas</h1>
                        <p className="text-slate-400 font-medium text-base md:text-lg italic">Personalizá la impresión para {product.name}.</p>
                    </header>

                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-xl space-y-8 md:space-y-10">
                        <div className="grid grid-cols-2 gap-4 md:gap-10">
                            <div>
                                <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-3 md:mb-4">ANCHO (mm)</h2>
                                <input type="number" value={width} onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-4 md:p-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-lg md:text-xl focus:ring-2 focus:ring-indigo-500/20 text-center md:text-left" />
                            </div>
                            <div>
                                <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-3 md:mb-4">ALTO (mm)</h2>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-4 md:p-5 bg-slate-50 rounded-2xl border-none outline-none font-bold text-lg md:text-xl focus:ring-2 focus:ring-indigo-500/20 text-center md:text-left" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase mb-4">UBICACIÓN DEL QR</h2>
                            {/* CORRECCIÓN: flex-col en celular, grid en pc */}
                            <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4">
                                {[{ id: 'qr-left', l: 'IZQUIERDA' }, { id: 'qr-center', l: 'CENTRO' }, { id: 'qr-right', l: 'DERECHA' }].map(pos => (
                                    <button key={pos.id} onClick={() => setLayout(pos.id)} className={`p-4 rounded-2xl border-2 font-black text-[10px] transition-all w-full ${layout === pos.id ? 'border-indigo-600 bg-indigo-600 text-white md:-translate-y-1 shadow-md' : 'border-slate-100 text-slate-400 bg-slate-50 hover:border-slate-200'}`}>{pos.l}</button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Visibilidad</h2>
                                <Toggle active={showName} label="Nombre" onClick={() => setShowName(!showName)} />
                                <Toggle active={showPrice} label="Precio" onClick={() => setShowPrice(!showPrice)} />
                                <Toggle active={showSku} label="Código" onClick={() => setShowSku(!showSku)} />
                                <Toggle active={showPromo} label="Promo" onClick={() => setShowPromo(!showPromo)} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Textos Adicionales</h2>
                                <input type="text" value={extraNote} onChange={e => setExtraNote(e.target.value)} placeholder="Nota al pie..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white transition-all outline-none" />
                                {showPromo && <input type="text" value={promoText} onChange={e => setPromoText(e.target.value)} className="w-full p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-sm font-bold text-indigo-700 outline-none animate-in fade-in" />}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h2 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Logo de Empresa</h2>
                            {!logoBase64 ? (
                                <label className="flex items-center justify-center gap-3 w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <Upload size={20} />
                                    <span className="font-bold text-sm">Seleccionar Imagen</span>
                                    <input type="file" onChange={handleLogoUpload} className="hidden" />
                                </label>
                            ) : (
                                <div className="relative inline-block group">
                                    <img src={logoBase64} className="h-16 w-auto rounded-xl border p-2 bg-slate-50" />
                                    <button onClick={() => setLogoBase64(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"><X size={14} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="sticky top-8 space-y-6 md:space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 text-white shadow-2xl relative group overflow-hidden">
                            <div className="flex items-center justify-center gap-3 mb-6 md:mb-10 text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em]"><Eye size={12} /> Previsualización</div>

                            <div className="flex justify-center mb-8 md:mb-12 relative overflow-hidden w-full">
                                {/* CAJA EXTERNA */}
                                <div style={{ width: w * 3.8, height: h * 3.8 }} className="bg-white flex items-center justify-center border-4 border-white/5 transition-all duration-300 shadow-2xl overflow-hidden max-w-full">
                                    {/* CAJA INTERNA */}
                                    <div style={{ width: 190, height: 95, transform: `scale(${scale})`, transformOrigin: 'center' }} className={`text-black flex items-center p-3 w-full h-full ${!hasContent ? (layout === 'qr-left' ? 'justify-start' : (layout === 'qr-right' ? 'justify-end' : 'justify-center')) : 'justify-center'}`}>
                                        {layout === 'qr-center' && hasContent ? (
                                            <div className="flex w-full h-full items-center">
                                                <div className="flex-1 flex flex-col items-start justify-center text-left p-1 overflow-hidden leading-none">
                                                    {logoBase64 && <img src={logoBase64} className="w-6 h-4 object-contain mb-1" />}
                                                    {showName && <span className="text-[5px] font-bold uppercase truncate w-full">{product.name}</span>}
                                                    {showPrice && <span className="text-[10px] font-black tracking-tighter">${product.price_installments}</span>}
                                                </div>
                                                <div className="w-[30%] flex items-center justify-center">{qrBase64 && <img src={qrBase64} className="h-full object-contain" />}</div>
                                                <div className="flex-1 flex flex-col items-end justify-center text-right p-1 leading-none">
                                                    {showPromo && <span className="bg-black text-white text-[4px] px-1 rounded font-black uppercase mb-1">{promoText || 'PROMO'}</span>}
                                                    {extraNote && <span className="text-[3px] text-slate-500">{extraNote}</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`flex w-full h-full items-center ${layout === 'qr-left' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {hasContent && (
                                                    <div className={`flex-1 flex flex-col justify-center p-1 ${layout === 'qr-right' ? 'items-start text-left' : 'items-end text-right'}`}>
                                                        {logoBase64 && <img src={logoBase64} className="w-7 h-5 object-contain mb-2" />}
                                                        {showName && <span className="text-[6px] font-bold leading-none uppercase mb-1">{product.name}</span>}
                                                        {showPrice && <span className="text-[14px] font-black tracking-tighter leading-none">${product.price_installments}</span>}
                                                        {showPromo && <span className="bg-black text-white text-[5px] px-1.5 py-0.5 rounded mt-2 font-black uppercase">{promoText || 'PROMO'}</span>}
                                                    </div>
                                                )}
                                                <div className={`${!hasContent ? 'w-auto' : 'w-[45%]'} h-full flex items-center justify-center`}>
                                                    {qrBase64 && <img src={qrBase64} style={{ height: '80%' }} className="object-contain" />}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {product && (
                                <PDFDownloadLink
                                    document={<LabelPDF productName={product.name} price={product.price_installments} sku={product.sku} qrCodeData={qrBase64} widthMm={debouncedWidth} heightMm={debouncedHeight} layout={layout} showPrice={showPrice} showSku={showSku} showName={showName} logoBase64={logoBase64} promoText={showPromo ? promoText : ''} extraNote={extraNote} />}
                                    fileName={`simplik-${product.name}.pdf`}
                                    className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 md:py-6 rounded-2xl md:rounded-3xl transition-all shadow-xl uppercase text-xs tracking-widest active:scale-95"
                                >
                                    {({ loading }) => (
                                        <>
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                                            {loading ? 'Generando...' : 'Descargar PDF'}
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