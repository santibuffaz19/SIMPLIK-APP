'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Camera, Film, Package, Upload, X, Loader2, Sparkles,
    ChevronDown, ChevronUp, Download, RefreshCw, Check, AlertCircle,
    User, ImageIcon, Wand2, Play
} from 'lucide-react';
import { uploadImageAction } from '../../tool-1-QR/actions';
import {
    generateImageAction, generateVideoAction, checkGenerationStatusAction,
    getProductsForAiAction, getSavedModelsAction, type Pipeline
} from '../actions';

// ─── Tipos ───────────────────────────────────────────────────
type GenType = 'foto' | 'video';
type Mode = 'product' | 'fashion' | 'food';

const PIPELINE_MAP: Record<GenType, Record<Mode, Pipeline>> = {
    foto: { product: 'product_photo', fashion: 'fashion_photo', food: 'food_photo' },
    video: { product: 'product_video', fashion: 'fashion_video', food: 'food_video' },
};

const BG_PRESETS_PHOTO = [
    { value: 'white_studio', label: 'Estudio Blanco' },
    { value: 'black_studio', label: 'Estudio Negro' },
    { value: 'ecommerce_premium', label: 'E-commerce Premium' },
    { value: 'minimalist', label: 'Minimalista' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'wooden_table', label: 'Mesa de Madera' },
    { value: 'beach', label: 'Playa' },
    { value: 'advertising', label: 'Publicitario' },
    { value: 'modern_kitchen', label: 'Cocina Moderna' },
    { value: 'elegant_office', label: 'Oficina Elegante' },
    { value: 'storefront', label: 'Vidriera' },
    { value: 'space', label: 'Espacio' },
    { value: 'urban_street', label: 'Calle Urbana' },
    { value: 'editorial_studio', label: 'Studio Editorial' },
    { value: 'rooftop', label: 'Rooftop' },
    { value: 'modern_cafe', label: 'Café Moderno' },
    { value: 'pasarela', label: 'Pasarela' },
    { value: 'gastronomic', label: 'Gastronómico' },
];

const POSES_PRODUCT = [
    { value: 'centered_front', label: 'Centrado Frontal' },
    { value: 'three_quarters', label: '3/4' },
    { value: 'tilted', label: 'Inclinado' },
    { value: 'on_table', label: 'Sobre Mesa' },
    { value: 'floating', label: 'Flotando' },
    { value: 'in_use', label: 'En Uso' },
    { value: 'close_up', label: 'Primer Plano' },
    { value: 'advertising', label: 'Plano Publicitario' },
    { value: 'macro', label: 'Macro Detalle' },
    { value: 'still_life', label: 'Bodegón' },
];

const POSES_FASHION = [
    { value: 'standing_front', label: 'Parado de Frente' },
    { value: 'walking', label: 'Caminando' },
    { value: 'sitting', label: 'Sentado' },
    { value: 'turned_three_quarters', label: 'Girado 3/4' },
    { value: 'back_pose', label: 'Espalda' },
    { value: 'editorial_pose', label: 'Pose Editorial' },
    { value: 'urban_pose', label: 'Pose Urbana' },
    { value: 'sports_pose', label: 'Pose Deportiva' },
];

const STYLES_PHOTO: Record<Mode, { value: string; label: string }[]> = {
    product: [
        { value: 'ecommerce', label: 'E-commerce' },
        { value: 'advertising_product', label: 'Publicitario' },
        { value: 'premium', label: 'Premium' },
        { value: 'cinematic', label: 'Cinematográfico' },
        { value: 'minimalist', label: 'Minimalista' },
        { value: 'hyperrealistic', label: 'Hiperrealista' },
        { value: 'lifestyle', label: 'Lifestyle' },
    ],
    fashion: [
        { value: 'ecommerce', label: 'Catálogo E-commerce' },
        { value: 'editorial', label: 'Editorial' },
        { value: 'lifestyle', label: 'Lifestyle' },
        { value: 'streetwear', label: 'Streetwear' },
        { value: 'premium', label: 'Premium' },
        { value: 'sports', label: 'Deportivo' },
        { value: 'luxury', label: 'Lujo' },
        { value: 'brand_campaign', label: 'Campaña de Marca' },
    ],
    food: [
        { value: 'food_premium', label: 'Gourmet Premium' },
        { value: 'food_delivery', label: 'Delivery / Menú' },
        { value: 'advertising_product', label: 'Publicitario' },
        { value: 'lifestyle', label: 'Lifestyle' },
        { value: 'cinematic', label: 'Cinematográfico' },
    ],
};

const CAMERA_MOTIONS = [
    { value: 'zoom_in', label: 'Zoom In Suave' },
    { value: 'zoom_out', label: 'Zoom Out' },
    { value: 'pan_left', label: 'Paneo Lateral' },
    { value: 'orbit_360', label: 'Giro 360°' },
    { value: 'cinematic_approach', label: 'Acercamiento Cinemático' },
    { value: 'macro_detail', label: 'Macro Detalle' },
    { value: 'static_ambient', label: 'Cámara Fija + Ambiente' },
];

const INTERACTIONS = [
    'Una persona usándolo', 'Una mano sosteniéndolo', 'Con gotas de agua',
    'Con hielo y vapor', 'Con frutas alrededor', 'Sobre arena', 'Con accesorios',
    'En una vidriera', 'Con vapor caliente', 'Con efecto splash',
    'Persona caminando con la prenda', 'Mostrando detalle de tela',
];

const EXTRAS = [
    'Iluminación dramática', 'Sombras suaves', 'Reflejos realistas',
    'Estilo premium', 'Brillo natural', 'Con gotas de rocío',
    'Bokeh suave en fondo', 'Luz dorada', 'Muy nítido 8K', 'Hiperrealista',
];

// ─── Componente UploadArea ────────────────────────────────────
function UploadArea({
    images, maxImages, onAdd, onRemove, label, uploading
}: {
    images: string[]; maxImages: number; onAdd: (url: string) => void;
    onRemove: (i: number) => void; label: string; uploading: boolean;
}) {
    const [localUploading, setLocalUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || images.length >= maxImages) return;
        setLocalUploading(true);
        const fd = new FormData(); fd.append('file', file);
        const res = await uploadImageAction(fd);
        if (res.success && res.url) onAdd(res.url);
        setLocalUploading(false);
        e.target.value = '';
    };

    return (
        <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">{label} ({images.length}/{maxImages})</label>
            <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 group">
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => onRemove(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={16} className="text-white" />
                        </button>
                    </div>
                ))}
                {images.length < maxImages && (
                    <label className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                        {localUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={16} />}
                        <span className="text-[9px] font-bold mt-1">Subir</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={localUploading} />
                    </label>
                )}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────
function GeneradorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const tipoParam = searchParams.get('tipo') as GenType || 'foto';
    const [genType, setGenType] = useState<GenType>(tipoParam);
    const [mode, setMode] = useState<Mode>('product');

    // Producto
    const [productos, setProductos] = useState<any[]>([]);
    const [productosGuardados, setProductosGuardados] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [uploadedRefs, setUploadedRefs] = useState<string[]>([]);
    const [productSource, setProductSource] = useState<'db' | 'manual'>('db');
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Modelo (moda)
    const [savedModels, setSavedModels] = useState<any[]>([]);
    const [modelSource, setModelSource] = useState<'saved' | 'manual'>('saved');
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [uploadedModelImages, setUploadedModelImages] = useState<string[]>([]);

    // Escena
    const [bgType, setBgType] = useState<'preset' | 'color' | 'prompt'>('preset');
    const [bgPreset, setBgPreset] = useState('white_studio');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [bgPrompt, setBgPrompt] = useState('');
    const [pose, setPose] = useState('');
    const [interaction, setInteraction] = useState('');
    const [extras, setExtras] = useState<string[]>([]);
    const [style, setStyle] = useState('');
    const [customExtra, setCustomExtra] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Video
    const [duration, setDuration] = useState(5);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [cameraMotion, setCameraMotion] = useState('');

    // Generación
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<{ url: string; type: GenType } | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendingPoll, setPendingPoll] = useState(false);

    useEffect(() => {
        getProductsForAiAction().then(r => { if (r.success && r.data) setProductos(r.data); });
        getSavedModelsAction().then(r => { if (r.success && r.data) setSavedModels(r.data); });
    }, []);

    // Polling para videos asincrónicos
    useEffect(() => {
        if (!pendingPoll || !generationId) return;
        pollingRef.current = setInterval(async () => {
            const res = await checkGenerationStatusAction(generationId);
            if (res.status === 'completed' && res.outputUrl) {
                setResult({ url: res.outputUrl, type: genType });
                setPendingPoll(false);
                setGenerating(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
            } else if (res.status === 'failed') {
                setError(res.error || 'La generación falló.');
                setPendingPoll(false);
                setGenerating(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
            }
        }, 5000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [pendingPoll, generationId]);

    const toggleProductId = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 3)
        );
    };

    const toggleExtra = (e: string) => {
        setExtras(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
    };

    const productsFiltrados = productos.filter(p =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const getSelectedProducts = () => productos.filter(p => selectedProductIds.includes(p.id));

    const extraPromptFinal = [
        ...extras,
        customExtra.trim() ? customExtra.trim() : '',
    ].filter(Boolean).join(', ');

    const canGenerate = () => {
        const hasProduct = productSource === 'manual'
            ? uploadedRefs.length >= 1
            : selectedProductIds.length >= 1;
        if (!hasProduct) return false;
        if (mode === 'fashion' && modelSource === 'manual' && uploadedModelImages.length === 0) return false;
        if (mode === 'fashion' && modelSource === 'saved' && !selectedModelId) return false;
        return true;
    };

    const handleGenerate = async () => {
        if (!canGenerate()) return;
        setGenerating(true);
        setError(null);
        setResult(null);
        setPendingPoll(false);

        const selectedProducts = getSelectedProducts();
        const productName = selectedProducts.length > 0
            ? selectedProducts.map(p => p.name).join(' + ')
            : '';

        const pipeline = PIPELINE_MAP[genType][mode];

        const baseParams = {
            pipeline,
            productIds: productSource === 'db' ? selectedProductIds : [],
            uploadedReferenceImages: productSource === 'manual' ? uploadedRefs : [],
            savedModelId: mode === 'fashion' && modelSource === 'saved' ? selectedModelId : undefined,
            uploadedModelImages: mode === 'fashion' && modelSource === 'manual' ? uploadedModelImages : [],
            backgroundType: bgType,
            backgroundPreset: bgType === 'preset' ? bgPreset : undefined,
            backgroundColor: bgType === 'color' ? bgColor : undefined,
            backgroundPrompt: bgType === 'prompt' ? bgPrompt : undefined,
            pose: pose || undefined,
            interactionPrompt: interaction || undefined,
            extraPrompt: extraPromptFinal || undefined,
            style: style || undefined,
            productName,
        };

        if (genType === 'foto') {
            const res = await generateImageAction(baseParams);
            if (res.success && res.outputUrl) {
                setResult({ url: res.outputUrl, type: 'foto' });
                setGenerationId(res.generationId || null);
            } else {
                setError(res.error || 'Error desconocido al generar.');
            }
            setGenerating(false);
        } else {
            const res = await generateVideoAction({
                ...baseParams,
                cameraMotion: cameraMotion || undefined,
                durationSeconds: duration,
                aspectRatio,
            });
            setGenerationId(res.generationId || null);
            if (res.success && res.outputUrl) {
                setResult({ url: res.outputUrl, type: 'video' });
                setGenerating(false);
            } else if (res.success && (res as any).pending) {
                setPendingPoll(true);
                // generating remains true, polling will update
            } else {
                setError(res.error || 'Error desconocido al generar.');
                setGenerating(false);
            }
        }
    };

    const poses = mode === 'fashion' ? POSES_FASHION : POSES_PRODUCT;
    const styles = STYLES_PHOTO[mode] || STYLES_PHOTO.product;

    const accentColor = genType === 'foto' ? 'rose' : 'violet';
    const accentClasses = {
        bg: genType === 'foto' ? 'bg-rose-600' : 'bg-violet-600',
        bgHover: genType === 'foto' ? 'hover:bg-rose-700' : 'hover:bg-violet-700',
        border: genType === 'foto' ? 'border-rose-500' : 'border-violet-500',
        text: genType === 'foto' ? 'text-rose-600' : 'text-violet-600',
        ring: genType === 'foto' ? 'ring-rose-500/20' : 'ring-violet-500/20',
        chipActive: genType === 'foto' ? 'bg-rose-600 text-white border-rose-600' : 'bg-violet-600 text-white border-violet-600',
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-4-ai" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                    Generar Sesión de {genType === 'foto' ? 'Fotos' : 'Videos'}
                </h1>
            </div>

            {/* Tipo: Foto / Video */}
            <div className="flex gap-3 mb-8">
                {(['foto', 'video'] as GenType[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setGenType(t)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm border-2 transition-all ${genType === t
                            ? t === 'foto' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        {t === 'foto' ? <Camera size={16} /> : <Film size={16} />}
                        {t === 'foto' ? 'Fotos' : 'Videos'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── PANEL IZQUIERDO: CONFIGURACIÓN ─────── */}
                <div className="lg:col-span-7 space-y-5">

                    {/* Modo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3">Tipo de Sesión</label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { value: 'product', label: 'Producto', icon: Package },
                                { value: 'fashion', label: 'Moda', icon: User },
                                { value: 'food', label: 'Comida', icon: ImageIcon },
                            ] as { value: Mode; label: string; icon: any }[]).map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMode(m.value)}
                                    className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${mode === m.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                >
                                    <m.icon size={18} /> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fuente del producto */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Producto de Referencia</label>
                            <div className="flex gap-1">
                                {(['db', 'manual'] as const).map(src => (
                                    <button key={src} onClick={() => setProductSource(src)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${productSource === src ? accentClasses.chipActive : 'border-slate-200 text-slate-500'}`}>
                                        {src === 'db' ? 'Del Catálogo' : 'Subir Fotos'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {productSource === 'db' ? (
                            <div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                        onFocus={() => setShowProductDropdown(true)}
                                        placeholder="Buscar producto del catálogo..."
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 bg-slate-50"
                                    />
                                    {showProductDropdown && productsFiltrados.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                                            {productsFiltrados.slice(0, 20).map(p => (
                                                <button key={p.id} onClick={() => { toggleProductId(p.id); setShowProductDropdown(false); setProductSearch(''); }}
                                                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors ${selectedProductIds.includes(p.id) ? 'bg-rose-50' : ''}`}>
                                                    <img src={p.image_urls?.[0] || 'https://placehold.co/40x40'} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                                        {p.sku && <p className="text-xs text-slate-400 font-mono">{p.sku}</p>}
                                                    </div>
                                                    {selectedProductIds.includes(p.id) && <Check size={16} className="text-rose-500 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedProductIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {getSelectedProducts().map(p => (
                                            <div key={p.id} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-bold">
                                                <img src={p.image_urls?.[0] || 'https://placehold.co/24x24'} className="w-5 h-5 rounded-full object-cover" />
                                                {p.name}
                                                <button onClick={() => toggleProductId(p.id)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedProductIds.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-2 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                                        Buscá y seleccioná hasta 3 productos del catálogo
                                    </p>
                                )}
                            </div>
                        ) : (
                            <UploadArea
                                images={uploadedRefs} maxImages={4}
                                onAdd={url => setUploadedRefs(prev => [...prev, url])}
                                onRemove={i => setUploadedRefs(prev => prev.filter((_, idx) => idx !== i))}
                                label="Fotos del producto (2-4 recomendadas)"
                                uploading={false}
                            />
                        )}
                    </div>

                    {/* Modelo humano (solo moda) */}
                    {mode === 'fashion' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Modelo Humano</label>
                                <div className="flex gap-1">
                                    {(['saved', 'manual'] as const).map(src => (
                                        <button key={src} onClick={() => setModelSource(src)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${modelSource === src ? accentClasses.chipActive : 'border-slate-200 text-slate-500'}`}>
                                            {src === 'saved' ? 'Guardados' : 'Subir Ahora'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {modelSource === 'saved' ? (
                                savedModels.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-sm text-slate-500 font-medium mb-2">No hay modelos guardados.</p>
                                        <Link href="/dashboard/tools/tool-4-ai/configuracion" className="text-xs font-black text-rose-600 hover:underline">
                                            Ir a Configuración →
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {savedModels.map(m => (
                                            <button key={m.id} onClick={() => setSelectedModelId(m.id === selectedModelId ? '' : m.id)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${selectedModelId === m.id ? accentClasses.chipActive : 'border-slate-200 hover:border-slate-300'}`}>
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                                    {m.reference_images?.[0]
                                                        ? <img src={m.reference_images[0]} className="w-full h-full object-cover" />
                                                        : <User size={24} className="text-slate-400 m-auto mt-2" />}
                                                </div>
                                                <span className="text-xs font-bold truncate w-full">{m.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <UploadArea
                                    images={uploadedModelImages} maxImages={4}
                                    onAdd={url => setUploadedModelImages(prev => [...prev, url])}
                                    onRemove={i => setUploadedModelImages(prev => prev.filter((_, idx) => idx !== i))}
                                    label="Fotos del modelo (frente, perfil, cuerpo)"
                                    uploading={false}
                                />
                            )}
                        </div>
                    )}

                    {/* Fondo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Fondo / Ambiente</label>
                        <div className="flex gap-2">
                            {(['preset', 'color', 'prompt'] as const).map(t => (
                                <button key={t} onClick={() => setBgType(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${bgType === t ? accentClasses.chipActive : 'border-slate-200 text-slate-500'}`}>
                                    {t === 'preset' ? 'Presets' : t === 'color' ? 'Color' : 'Personalizado'}
                                </button>
                            ))}
                        </div>

                        {bgType === 'preset' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {BG_PRESETS_PHOTO.map(p => (
                                    <button key={p.value} onClick={() => setBgPreset(p.value)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${bgPreset === p.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50'}`}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {bgType === 'color' && (
                            <div className="flex items-center gap-3">
                                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0" />
                                <span className="text-sm font-mono text-slate-600">{bgColor}</span>
                            </div>
                        )}
                        {bgType === 'prompt' && (
                            <textarea rows={2} value={bgPrompt} onChange={e => setBgPrompt(e.target.value)}
                                placeholder="Describí el fondo que querés... Ej: terraza de edificio en Nueva York al atardecer"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 resize-none bg-slate-50" />
                        )}
                    </div>

                    {/* Pose */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Pose / Composición</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {poses.map(p => (
                                <button key={p.value} onClick={() => setPose(pose === p.value ? '' : p.value)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${pose === p.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interacción */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Interacción / Contexto</label>
                        <div className="flex flex-wrap gap-2">
                            {INTERACTIONS.map(it => (
                                <button key={it} onClick={() => setInteraction(interaction === it ? '' : it)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${interaction === it ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                    {it}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estilo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Estilo Visual</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {styles.map(s => (
                                <button key={s.value} onClick={() => setStyle(style === s.value ? '' : s.value)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${style === s.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50'}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Parámetros de Video */}
                    {genType === 'video' && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Parámetros de Video</label>

                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">Movimiento de Cámara</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CAMERA_MOTIONS.map(m => (
                                        <button key={m.value} onClick={() => setCameraMotion(cameraMotion === m.value ? '' : m.value)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${cameraMotion === m.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50'}`}>
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">Duración</label>
                                    <div className="flex gap-2">
                                        {[3, 5, 8, 10].map(d => (
                                            <button key={d} onClick={() => setDuration(d)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${duration === d ? accentClasses.chipActive : 'border-slate-200 text-slate-600'}`}>
                                                {d}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">Formato</label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: '16:9', label: '16:9' },
                                            { value: '9:16', label: '9:16' },
                                            { value: '1:1', label: '1:1' },
                                        ].map(ar => (
                                            <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${aspectRatio === ar.value ? accentClasses.chipActive : 'border-slate-200 text-slate-600'}`}>
                                                {ar.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Extras avanzados */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Extras Visuales (Avanzado)</span>
                            {showAdvanced ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                        {showAdvanced && (
                            <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                                <div className="flex flex-wrap gap-2 pt-3">
                                    {EXTRAS.map(e => (
                                        <button key={e} onClick={() => toggleExtra(e)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${extras.includes(e) ? accentClasses.chipActive : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                            {e}
                                        </button>
                                    ))}
                                </div>
                                <input type="text" value={customExtra} onChange={e => setCustomExtra(e.target.value)}
                                    placeholder="O escribí tus propios extras visuales..."
                                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 bg-slate-50" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PANEL DERECHO: RESULTADO ─────────────── */}
                <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6 lg:self-start">

                    {/* Vista previa de referencias */}
                    {(selectedProductIds.length > 0 || uploadedRefs.length > 0) && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3">Referencias del Producto</label>
                            <div className="flex flex-wrap gap-2">
                                {productSource === 'db'
                                    ? getSelectedProducts().flatMap(p =>
                                    ([...(p.internal_reference_images || []), ...(p.image_urls || [])].slice(0, 3).map((url: string, i: number) => (
                                        <div key={`${p.id}-${i}`} className="relative">
                                            <img src={url} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                                        </div>
                                    )))
                                    )
                                    : uploadedRefs.map((url, i) => (
                                        <img key={i} src={url} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Botón generar */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !canGenerate()}
                        className={`w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${accentClasses.bg} ${accentClasses.bgHover} ${genType === 'foto' ? 'shadow-rose-500/20' : 'shadow-violet-500/20'}`}
                    >
                        {generating ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                {pendingPoll ? 'Procesando video...' : 'Generando...'}
                            </>
                        ) : (
                            <>
                                <Wand2 size={22} />
                                {genType === 'foto' ? 'Generar Imagen' : 'Generar Video'}
                            </>
                        )}
                    </button>

                    {!canGenerate() && !generating && (
                        <p className="text-xs text-center text-slate-400 font-medium -mt-2">
                            {productSource === 'manual' && uploadedRefs.length === 0
                                ? 'Subí al menos 1 foto de referencia'
                                : mode === 'fashion'
                                    ? 'Seleccioná o subí un modelo para continuar'
                                    : 'Seleccioná al menos 1 producto para continuar'}
                        </p>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-700 text-sm">Error en la generación</p>
                                <p className="text-xs text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Resultado */}
                    {result && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-900 p-3 flex items-center justify-between">
                                <span className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Check size={14} className="text-emerald-400" /> Resultado generado
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={handleGenerate} title="Regenerar variante"
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                                        <RefreshCw size={14} />
                                    </button>
                                    <a href={result.url} download target="_blank"
                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                                        <Download size={14} />
                                    </a>
                                </div>
                            </div>

                            {result.type === 'foto' ? (
                                <img src={result.url} className="w-full object-contain bg-slate-100" />
                            ) : (
                                <video src={result.url} controls className="w-full bg-black" playsInline />
                            )}

                            <div className="p-4 border-t border-slate-100 flex gap-2">
                                <a href={result.url} download target="_blank"
                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                                    <Download size={16} /> Descargar
                                </a>
                                <button onClick={handleGenerate}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors ${accentClasses.bg} ${accentClasses.bgHover} text-white`}>
                                    <RefreshCw size={16} /> Variante
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Procesando video (polling) */}
                    {pendingPoll && (
                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center">
                            <Loader2 size={32} className="animate-spin text-violet-600 mx-auto mb-3" />
                            <p className="font-black text-violet-800 text-sm">Generando tu video...</p>
                            <p className="text-xs text-violet-600 mt-1">Los videos pueden tardar entre 1 y 3 minutos. Podés esperar aquí o ir al historial.</p>
                            <Link href="/dashboard/tools/tool-4-ai/historial" className="text-xs font-black text-violet-700 hover:underline mt-3 inline-block">
                                Ver Historial →
                            </Link>
                        </div>
                    )}

                    {/* Info limitaciones */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-xs font-black text-amber-800 mb-2 uppercase tracking-widest">Nota sobre fidelidad IA</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            {mode === 'fashion'
                                ? 'Las generaciones de moda son sesiones editoriales/promocionales. La IA no garantiza un "virtual try-on" exacto de la prenda. Para máxima fidelidad de color y estampado, subí múltiples referencias del producto.'
                                : mode === 'food'
                                    ? 'La IA generará imágenes inspiradas en tus referencias. El resultado puede variar en forma exacta pero mantendrá el estilo y ambiente elegido.'
                                    : 'La fidelidad al producto depende de la calidad de las imágenes de referencia. Subí fotos internas desde la sección de edición del producto para mejores resultados.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GeneradorPage() {
    return (
        <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-rose-600" size={36} /></div>}>
            <GeneradorContent />
        </Suspense>
    );
}