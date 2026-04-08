'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Video, Image as ImageIcon, Settings, Loader2, Sparkles, UserCircle, Upload, ChevronRight, History, Download, RefreshCw } from 'lucide-react';
import { obtenerProductosParaAIAction, obtenerModelosGuardadosAction, generateMediaWithAIAction, obtenerHistorialGeneracionesAction } from './actions';
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
    const [paramDuration, setParamDuration] = useState('5s'); // Solo Video

    // Generación
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentResult, setCurrentResult] = useState<any>(null);

    useEffect(() => {
        async function fetchAll() {
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
        const formData = new FormData(); formData.append('file', file);
        const res = await uploadImageAction(formData);
        if (res.success && res.url) setManualImages([...manualImages, res.url]);
        setUploadingManual(false);
    };

    const handleGenerate = async () => {
        if (!selectedProductId && manualImages.length === 0) {
            return alert("Seleccioná un producto de la base de datos o subí una imagen de referencia.");
        }
        if (mode === 'fashion' && !selectedModelId) {
            return alert("Seleccioná un modelo humano para el modo Moda.");
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
                ...(activeTab === 'video' && { duration: paramDuration })
            }
        };

        const res = await generateMediaWithAIAction(payload);
        if (res.success) {
            setCurrentResult(res.result);
            // Refrescar historial
            const resHist = await obtenerHistorialGeneracionesAction();
            if (resHist.success && resHist.data) setHistorial(resHist.data);
        } else {
            alert("Error en la generación: " + res.error);
        }
        setIsGenerating(false);
    };

    if (loadingData) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600" size={40} /></div>;

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans text-slate-800 min-h-screen pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-12 md:mt-0 md:ml-0 ml-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-pink-500" size={32} /> Estudio IA
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Generá fotos y videos profesionales de tus productos.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/tools/tool-4-ai-studio/configuracion" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm">
                        <Settings size={18} /> Modelos y Ajustes
                    </Link>
                </div>
            </header>

            {/* MAIN TABS */}
            <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mb-8 border border-slate-200">
                <button onClick={() => setActiveTab('photo')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'photo' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Camera size={18} /> Generar Fotos
                </button>
                <button onClick={() => setActiveTab('video')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'video' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Video size={18} /> Generar Videos
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* PANEL IZQUIERDO: CONTROLES */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">1. Categoría de Sesión</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setMode('product')} className={`py-2 rounded-lg text-sm font-bold border transition-colors ${mode === 'product' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>Producto</button>
                                <button onClick={() => setMode('fashion')} className={`py-2 rounded-lg text-sm font-bold border transition-colors ${mode === 'fashion' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>Moda</button>
                                <button onClick={() => setMode('food')} className={`py-2 rounded-lg text-sm font-bold border transition-colors ${mode === 'food' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>Comida</button>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">2. Producto Base (Referencia)</label>
                            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setManualImages([]) }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none mb-3">
                                <option value="">-- Seleccionar de mi catálogo --</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                                ))}
                            </select>

                            {!selectedProductId && (
                                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                                    <p className="text-xs text-slate-500 font-medium mb-3">O subí imágenes sueltas (Max 4)</p>
                                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                                        {manualImages.map((img, i) => (
                                            <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200"><img src={img} className="w-full h-full object-cover" /></div>
                                        ))}
                                    </div>
                                    {manualImages.length < 4 && (
                                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100">
                                            {uploadingManual ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir Referencia
                                            <input type="file" className="hidden" accept="image/*" onChange={handleManualUpload} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        {mode === 'fashion' && (
                            <div className="border-t border-slate-100 pt-5 bg-pink-50/50 -mx-6 px-6 pb-2">
                                <label className="text-xs font-bold text-pink-700 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><UserCircle size={14} /> Modelo Humano</label>
                                <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full p-3 bg-white border border-pink-200 rounded-xl text-sm font-bold outline-none">
                                    <option value="">-- Elegir modelo guardado --</option>
                                    {modelos.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-5 space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">3. Dirección de Arte</label>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Fondo / Ambiente</label>
                                <input type="text" placeholder="Ej: Estudio fotográfico blanco con sombras suaves" value={paramBackground} onChange={e => setParamBackground(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm mt-1 outline-none focus:border-pink-500" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Pose o Posición</label>
                                <input type="text" placeholder="Ej: Centrado, vista frontal 3/4" value={paramPose} onChange={e => setParamPose(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm mt-1 outline-none focus:border-pink-500" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Estilo Visual</label>
                                <select value={paramStyle} onChange={e => setParamStyle(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm mt-1 outline-none font-bold">
                                    <option value="premium">Premium E-commerce</option>
                                    <option value="editorial">Editorial / Revista</option>
                                    <option value="lifestyle">Lifestyle / Casual</option>
                                    <option value="cinematic">Cinematográfico</option>
                                    <option value="minimalist">Minimalista</option>
                                </select>
                            </div>

                            {activeTab === 'video' && (
                                <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase">Duración del Clip</label>
                                    <select value={paramDuration} onChange={e => setParamDuration(e.target.value)} className="w-full p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-sm mt-1 outline-none font-bold text-indigo-800">
                                        <option value="3s">3 Segundos</option>
                                        <option value="5s">5 Segundos</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${activeTab === 'photo' ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                            GENERAR {activeTab === 'photo' ? 'FOTO' : 'VIDEO'}
                        </button>
                    </div>
                </div>

                {/* PANEL DERECHO: RESULTADOS E HISTORIAL */}
                <div className="lg:col-span-8 space-y-6">

                    {/* RESULTADO ACTUAL */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[400px] flex flex-col relative">
                        {isGenerating ? (
                            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-10 text-white">
                                <RefreshCw className="animate-spin text-pink-500 mb-4" size={48} />
                                <h3 className="text-xl font-black tracking-widest uppercase">Generando IA...</h3>
                                <p className="text-slate-400 text-sm mt-2 text-center px-8">Procesando referencias, aplicando estilos y renderizando. <br />Esto puede tomar entre 10 y 30 segundos.</p>
                            </div>
                        ) : currentResult ? (
                            <div className="flex-1 flex flex-col md:flex-row">
                                <div className="flex-1 p-6 flex items-center justify-center bg-black/50">
                                    <img src={currentResult.url} className="max-w-full max-h-[500px] object-contain rounded-xl shadow-2xl" />
                                </div>
                                <div className="w-full md:w-72 bg-slate-800 p-6 border-l border-slate-700 flex flex-col">
                                    <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-sm flex items-center gap-2"><Sparkles size={16} className="text-pink-400" /> Resultado</h4>
                                    <div className="text-xs text-slate-400 space-y-2 flex-1">
                                        <p><span className="font-bold text-slate-300">Prompt final:</span><br /><span className="italic line-clamp-6 mt-1">{currentResult.prompt}</span></p>
                                        <p><span className="font-bold text-slate-300">Provider:</span> fal.ai</p>
                                    </div>
                                    <a href={currentResult.url} download target="_blank" className="w-full py-3 mt-4 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100">
                                        <Download size={18} /> Descargar
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                                <ImageIcon size={64} className="mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-slate-400">Lienzo Vacío</h3>
                                <p className="text-sm max-w-md mx-auto mt-2">Configurá los parámetros a la izquierda y hacé click en Generar para ver la magia de la IA.</p>
                            </div>
                        )}
                    </div>

                    {/* HISTORIAL */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="font-bold text-lg border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><History size={18} className="text-slate-400" /> Generaciones Anteriores</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {historial.map(h => (
                                <div key={h.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                    <img src={h.result_url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        <span className="text-white font-bold text-xs uppercase tracking-widest bg-black/50 px-2 py-1 rounded">{h.generation_type}</span>
                                        <a href={h.result_url} target="_blank" className="p-2 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform"><Download size={16} /></a>
                                    </div>
                                    {h.status === 'processing' && (
                                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={24} /></div>
                                    )}
                                </div>
                            ))}
                            {historial.length === 0 && <div className="col-span-full py-8 text-center text-slate-400 text-sm font-medium">No hay generaciones recientes.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}