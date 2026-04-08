'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Video, Image as ImageIcon, Settings, Loader2, Sparkles, UserCircle, Upload, ChevronRight, History, Download, RefreshCw, ShoppingBag, Shirt, Utensils, AlertCircle } from 'lucide-react';
import { obtenerProductosParaAIAction, obtenerModelosGuardadosAction, generateMediaWithAIAction, obtenerHistorialGeneracionesAction } from './actions';
// Ajustá esta ruta si tu actions de Tool 1 está en otra carpeta
import { uploadImageAction } from '../tool-1-QR/actions';

export default function AiStudioDashboard() {
    const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');
    const [mode, setMode] = useState<'product' | 'fashion' | 'food'>('product');
    const [loadingData, setLoadingData] = useState(true);

    // Data de Backend
    const [productos, setProductos] = useState<any[]>([]);
    const [modelos, setModelos] = useState<any[]>([]);
    const [historial, setHistorial] = useState<any[]>([]);

    // Estados de Formulario
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [manualImages, setManualImages] = useState<string[]>([]);
    const [uploadingManual, setUploadingManual] = useState(false);

    const [selectedModelId, setSelectedModelId] = useState<string>('');

    // Parámetros IA
    const [paramBackground, setParamBackground] = useState('');
    const [paramPose, setParamPose] = useState('');
    const [paramInteraction, setParamInteraction] = useState('');
    const [paramStyle, setParamStyle] = useState('premium');
    const [paramExtra, setParamExtra] = useState('');
    const [paramDuration, setParamDuration] = useState('5s'); // Video
    const [paramRatio, setParamRatio] = useState('16:9'); // Video

    // Generación
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentResult, setCurrentResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAll() {
            setLoadingData(true);
            const resProds = await obtenerProductosParaAIAction();
            if (resProds.success && resProds.data) setProductos(resProds.data);

            const resMods = await obtenerModelosGuardadosAction();
            if (resMods.success && resMods.data) setModelos(resMods.data);

            const resHist = await obtenerHistorialGeneracionesAction();
            if (resHist.success && resHist.data) setHistorial(resHist.data);

            setLoadingData(false);
        }
        fetchAll();
    }, []);

    const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingManual(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadImageAction(formData);
        if (res.success && res.url) {
            setManualImages([...manualImages, res.url]);
        } else {
            alert("Error subiendo imagen: " + res.error);
        }
        setUploadingManual(false);
    };

    const handleRemoveManualImage = (indexToRemove: number) => {
        setManualImages(manualImages.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerate = async () => {
        setErrorMsg(null);
        if (!selectedProductId && manualImages.length === 0) {
            setErrorMsg("Seleccioná un producto del catálogo o subí al menos una imagen de referencia.");
            return;
        }
        if (mode === 'fashion' && !selectedModelId) {
            setErrorMsg("Para el modo Moda, debés seleccionar un modelo humano guardado.");
            return;
        }

        setIsGenerating(true);
        setCurrentResult(null);

        const payload = {
            type: activeTab,
            mode: mode,
            productIds: selectedProductId ? [selectedProductId] : [],
            uploadedImages: manualImages,
            savedModelId: selectedModelId || null,
            parameters: {
                background: paramBackground,
                pose: paramPose,
                interaction: paramInteraction,
                style: paramStyle,
                extraPrompt: paramExtra,
                ...(activeTab === 'video' && { duration: paramDuration, aspectRatio: paramRatio })
            }
        };

        const res = await generateMediaWithAIAction(payload);
        if (res.success && res.result) {
            setCurrentResult(res.result);
            // Refrescar historial silenciosamente
            const resHist = await obtenerHistorialGeneracionesAction();
            if (resHist.success && resHist.data) setHistorial(resHist.data);
        } else {
            setErrorMsg(res.error || "Ocurrió un error inesperado al contactar con la IA.");
        }
        setIsGenerating(false);
    };

    if (loadingData) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-pink-600" size={40} /></div>;

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans text-slate-800 min-h-screen pb-24">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-12 md:mt-0 md:ml-0 ml-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-pink-500" size={32} /> Estudio IA
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Generá fotos y videos profesionales de tus productos.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tools/tool-4-ai-studio/configuracion" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl font-bold shadow-sm transition-all text-sm active:scale-95">
                        <Settings size={18} /> Modelos y Ajustes
                    </Link>
                </div>
            </header>

            {/* ERROR ALERT */}
            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm">No pudimos iniciar la generación</h4>
                        <p className="text-xs mt-1 opacity-80">{errorMsg}</p>
                    </div>
                </div>
            )}

            {/* TABS DE MODO PRINCIPAL */}
            <div className="flex p-1.5 bg-slate-200/60 rounded-2xl w-fit mb-8 border border-slate-200 shadow-inner">
                <button onClick={() => setActiveTab('photo')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'photo' ? 'bg-white text-pink-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Camera size={18} /> Fotos IA
                </button>
                <button onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'video' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Video size={18} /> Videos IA
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* PANEL IZQUIERDO: CONTROLES */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">

                        {/* PASO 1: CATEGORÍA */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center">1</span> Categoría
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setMode('product')} className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all ${mode === 'product' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}>
                                    <ShoppingBag size={18} /> Producto
                                </button>
                                <button onClick={() => setMode('fashion')} className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all ${mode === 'fashion' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}>
                                    <Shirt size={18} /> Ropa/Moda
                                </button>
                                <button onClick={() => setMode('food')} className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all ${mode === 'food' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}>
                                    <Utensils size={18} /> Comida
                                </button>
                            </div>
                        </div>

                        {/* PASO 2: PRODUCTO */}
                        <div className="border-t border-slate-100 pt-6">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center">2</span> Referencia
                            </label>
                            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setManualImages([]) }} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-pink-500 transition-colors mb-3 cursor-pointer">
                                <option value="">-- Seleccionar producto del catálogo --</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                                ))}
                            </select>

                            {!selectedProductId && (
                                <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wider">O subí fotos sueltas (Max 4)</p>
                                    <div className="flex flex-wrap gap-3 justify-center mb-4">
                                        {manualImages.map((img, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button onClick={() => handleRemoveManualImage(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {manualImages.length < 4 && (
                                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                                            {uploadingManual ? <Loader2 size={16} className="animate-spin text-pink-500" /> : <Upload size={16} className="text-slate-400" />}
                                            {uploadingManual ? 'Subiendo...' : 'Subir Foto de Ref.'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleManualUpload} disabled={uploadingManual} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PASO EXTRA PARA MODA: MODELO HUMANO */}
                        {mode === 'fashion' && (
                            <div className="border-t border-slate-100 pt-6 bg-gradient-to-b from-pink-50/50 to-transparent -mx-6 px-6 pb-2">
                                <label className="text-xs font-bold text-pink-700 uppercase tracking-widest block mb-3 flex items-center gap-2">
                                    <UserCircle size={16} /> Modelo Humano
                                </label>
                                <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full p-3.5 bg-white border border-pink-200 rounded-xl text-sm font-bold outline-none focus:border-pink-500 shadow-sm cursor-pointer">
                                    <option value="">-- Elegir modelo guardado --</option>
                                    {modelos.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                {modelos.length === 0 && <p className="text-xs text-pink-600/70 mt-2">No tenés modelos. Creá uno en "Modelos y Ajustes".</p>}
                            </div>
                        )}

                        {/* PASO 3: DIRECCIÓN DE ARTE */}
                        <div className="border-t border-slate-100 pt-6 space-y-5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center">3</span> Dirección de Arte
                            </label>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Fondo / Ambiente</label>
                                <textarea rows={2} placeholder="Ej: Estudio fotográfico blanco con sombras suaves" value={paramBackground} onChange={e => setParamBackground(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all resize-none" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Pose / Posición</label>
                                    <input type="text" placeholder="Ej: Vista frontal 3/4" value={paramPose} onChange={e => setParamPose(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Interacción</label>
                                    <input type="text" placeholder="Ej: Salpicadura de agua" value={paramInteraction} onChange={e => setParamInteraction(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Estilo Visual</label>
                                    <select value={paramStyle} onChange={e => setParamStyle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold focus:border-pink-500 cursor-pointer">
                                        <option value="premium">Premium E-commerce</option>
                                        <option value="editorial">Editorial / Revista</option>
                                        <option value="lifestyle">Lifestyle / Casual</option>
                                        <option value="cinematic">Cinematográfico</option>
                                        <option value="minimalist">Minimalista</option>
                                    </select>
                                </div>
                                {activeTab === 'video' && (
                                    <div>
                                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1.5">Duración</label>
                                        <select value={paramDuration} onChange={e => setParamDuration(e.target.value)} className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm outline-none font-bold text-indigo-700 cursor-pointer focus:border-indigo-500">
                                            <option value="3s">3 Segundos</option>
                                            <option value="5s">5 Segundos</option>
                                            <option value="8s">8 Segundos</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'video' && (
                                <div>
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1.5">Formato / Relación de Aspecto</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                                        <button onClick={() => setParamRatio('16:9')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paramRatio === '16:9' ? 'bg-white shadow-sm border border-slate-200 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>16:9 (Horizontal)</button>
                                        <button onClick={() => setParamRatio('9:16')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paramRatio === '9:16' ? 'bg-white shadow-sm border border-slate-200 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>9:16 (Vertical)</button>
                                        <button onClick={() => setParamRatio('1:1')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paramRatio === '1:1' ? 'bg-white shadow-sm border border-slate-200 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>1:1 (Cuadrado)</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Instrucciones Extra (Prompt)</label>
                                <textarea rows={2} placeholder="Ej: Iluminación dramática, muy nítido, render 8k..." value={paramExtra} onChange={e => setParamExtra(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all resize-none" />
                            </div>
                        </div>

                        {/* BOTÓN GENERAR */}
                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-[color]/20 flex items-center justify-center gap-3 transition-all ${isGenerating ? 'opacity-80 cursor-not-allowed scale-100' : 'active:scale-95 hover:-translate-y-1'} ${activeTab === 'photo' ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-pink-500/30' : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-indigo-500/30'}`}
                            >
                                {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="fill-white/20" />}
                                {isGenerating ? 'PROCESANDO MAGIA...' : `GENERAR ${activeTab === 'photo' ? 'FOTO' : 'VIDEO'}`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: RESULTADOS E HISTORIAL */}
                <div className="lg:col-span-8 space-y-6">

                    {/* RESULTADO ACTUAL */}
                    <div className="bg-[#0B0F19] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[450px] flex flex-col relative group">

                        {/* Decoración de fondo tech */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

                        {isGenerating ? (
                            <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-md flex flex-col items-center justify-center z-10 text-white">
                                <div className="relative">
                                    <div className="absolute inset-0 border-4 border-t-pink-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center shadow-inner shadow-black/50 m-2">
                                        <Sparkles className="text-white animate-pulse" size={24} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-black tracking-widest uppercase mt-6 bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">IA Trabajando</h3>
                                <p className="text-slate-400 text-sm mt-3 text-center px-8 max-w-md leading-relaxed">
                                    Analizando referencias, mapeando texturas y renderizando. <br />Esto toma entre 10 y 30 segundos. ¡No cierres la página!
                                </p>
                            </div>
                        ) : currentResult ? (
                            <div className="flex-1 flex flex-col md:flex-row relative z-10">
                                <div className="flex-1 p-6 md:p-10 flex items-center justify-center bg-black/40">
                                    {/* Si es video se vería acá, si es imagen se ve img */}
                                    {currentResult.url?.endsWith('.mp4') ? (
                                        <video src={currentResult.url} controls autoPlay loop className="max-w-full max-h-[550px] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" />
                                    ) : (
                                        <img src={currentResult.url} className="max-w-full max-h-[550px] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" />
                                    )}
                                </div>
                                <div className="w-full md:w-80 bg-slate-900/80 backdrop-blur p-6 md:p-8 border-l border-slate-800 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-white font-black mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Listo
                                        </h4>
                                        <div className="text-xs text-slate-400 space-y-4">
                                            <div>
                                                <span className="font-bold text-slate-300 block mb-1">Prompt interpretado:</span>
                                                <div className="bg-black/50 p-3 rounded-lg border border-slate-800 italic leading-relaxed line-clamp-6">{currentResult.prompt}</div>
                                            </div>
                                            <p className="flex items-center justify-between"><span className="font-bold text-slate-300">Motor IA:</span> <span className="bg-slate-800 px-2 py-1 rounded text-[10px]">fal.ai</span></p>
                                        </div>
                                    </div>
                                    <a href={currentResult.url} download target="_blank" className="w-full py-3.5 mt-8 bg-white text-slate-900 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 active:scale-95">
                                        <Download size={18} /> Descargar Original
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center relative z-10">
                                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-800">
                                    <ImageIcon size={40} className="opacity-30" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400">Lienzo Vacío</h3>
                                <p className="text-sm max-w-md mx-auto mt-3 text-slate-500 leading-relaxed">Configurá los parámetros a la izquierda y hacé click en <strong className="text-slate-300">Generar</strong> para ver cómo la Inteligencia Artificial cobra vida.</p>
                            </div>
                        )}
                    </div>

                    {/* HISTORIAL */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                            <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800"><History size={20} className="text-indigo-500" /> Tus Creaciones</h2>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{historial.length} guardadas</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {historial.map(h => (
                                <div key={h.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => h.status === 'completed' && setCurrentResult({ url: h.result_url, prompt: h.final_ai_prompt })}>

                                    {/* Muestra imagen o si es video un frame (o ícono) */}
                                    {h.result_url?.endsWith('.mp4') ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white relative">
                                            <Video size={24} className="opacity-50 mb-2" />
                                            <span className="text-[10px] font-bold opacity-50">Video</span>
                                        </div>
                                    ) : (
                                        <img src={h.result_url || 'https://placehold.co/400x400?text=Procesando'} className="w-full h-full object-cover" />
                                    )}

                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                                        <span className={`text-white font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${h.generation_type === 'video' ? 'bg-indigo-600' : 'bg-pink-600'}`}>
                                            {h.generation_type}
                                        </span>
                                        {h.status === 'completed' && (
                                            <a href={h.result_url} target="_blank" className="p-2 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-lg" onClick={e => e.stopPropagation()}>
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>

                                    {h.status === 'processing' && (
                                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                            <Loader2 className="animate-spin text-pink-500 mb-2" size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Creando</span>
                                        </div>
                                    )}
                                    {h.status === 'failed' && (
                                        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                            <AlertCircle className="text-red-400 mb-2" size={24} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Error</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {historial.length === 0 && (
                                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                        <ImageIcon size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-bold">No hay generaciones recientes.</p>
                                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">Tus fotos y videos generados se guardarán acá para que los descargues cuando quieras.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}