'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, BookOpen, Link as LinkIcon, Loader2, Database, Layout, X, Image as ImageIcon, Info, PlusCircle } from 'lucide-react';
import { guardarCatalogoAction, obtenerProductosParaCatalogoAction } from '../actions';
import { supabase } from '@/lib/supabase';

const convertirUrlDrive = (url: string) => {
    if (!url || !url.includes('drive.google.com')) return url;
    let fileId = '';
    const match = url.match(/\/file\/d\/(.+?)\//) || url.match(/\?id=(.+?)(&|$)/);
    if (match) fileId = match[1];
    return fileId ? `https://drive.google.com/uc?id=${fileId}` : url;
};

export default function CrearRevista() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [productosDB, setProductosDB] = useState<any[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverTitle, setCoverTitle] = useState('');
    const [coverColor, setCoverColor] = useState('#0a0a0a');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [items, setItems] = useState<any[]>([]);

    const [showDbModal, setShowDbModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    const [manualImg, setManualImg] = useState('');
    const [manualName, setManualName] = useState('');
    const [manualSku, setManualSku] = useState('');
    const [manualPrice, setManualPrice] = useState('');
    const [manualVariants, setManualVariants] = useState('');
    const [manualSpecs, setManualSpecs] = useState([{ id: 1, clave: '', valor: '' }]);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            const res = await obtenerProductosParaCatalogoAction();
            if (res.success && res.data) setProductosDB(res.data);
            setLoading(false);
        }
        fetchProducts();
    }, []);

    const agregarProductoDb = (prod: any) => {
        setItems([...items, {
            type: 'db',
            id: Date.now().toString(),
            db_id: prod.id,
            name: prod.name,
            sku: prod.sku,
            price: prod.price_installments,
            image_url: prod.image_urls?.[0] || '',
            image_urls: prod.image_urls || [], // Guardamos todas las fotos
            video_url: prod.video_url || '', // Guardamos el video
            variants: prod.variants_config ? prod.variants_config.map((v: any) => v.valores).join(' | ') : '',
            technical_specs: prod.technical_specs || []
        }]);
        setShowDbModal(false);
    };

    const agregarProductoManualYGuardarEnBD = async () => {
        if (!manualImg || !manualName) return alert("Imagen y Nombre son obligatorios");
        setLoading(true);

        const finalImg = convertirUrlDrive(manualImg);
        const finalSpecs = manualSpecs.filter(s => s.clave.trim() && s.valor.trim());
        const finalVariants = manualVariants.trim() ? [{ id: Date.now(), nombre: 'Variante', valores: manualVariants }] : [];

        const { data: newProd, error } = await supabase.from('products').insert({
            name: manualName,
            sku: manualSku || null,
            price_installments: parseFloat(manualPrice) || 0,
            image_urls: [finalImg],
            technical_specs: finalSpecs,
            variants_config: finalVariants
        }).select('*').single();

        if (error) {
            alert("Error al guardar: " + error.message);
            setLoading(false);
            return;
        }

        agregarProductoDb(newProd);
        setProductosDB([newProd, ...productosDB]);

        setManualImg(''); setManualName(''); setManualSku(''); setManualPrice(''); setManualVariants('');
        setManualSpecs([{ id: 1, clave: '', valor: '' }]);
        setShowManualModal(false);
        setLoading(false);
    };

    const eliminarItem = (id: string) => setItems(items.filter(item => item.id !== id));

    const handleGuardar = async () => {
        if (!name || items.length === 0) return alert('Poné un nombre y al menos 1 producto.');
        setSaving(true);
        const catalogoData = { name, description, cover_title: coverTitle || name, cover_color: coverColor, font_family: fontFamily, items };
        const res = await guardarCatalogoAction(catalogoData);
        if (res.success) router.push('/dashboard/tools/tool-3-catalogos');
        else alert('Error al guardar');
        setSaving(false);
    };

    const agregarSpecManual = () => setManualSpecs([...manualSpecs, { id: Date.now(), clave: '', valor: '' }]);
    const actualizarSpecManual = (id: number, campo: 'clave' | 'valor', valor: string) => {
        setManualSpecs(manualSpecs.map(s => s.id === id ? { ...s, [campo]: valor } : s));
    };
    const eliminarSpecManual = (id: number) => setManualSpecs(manualSpecs.filter(s => s.id !== id));

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24 relative">
            <div className="flex items-center gap-4 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-3-catalogos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Armar Revista 3D</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="font-bold text-lg border-b border-slate-100 pb-3 flex items-center gap-2"><Layout size={18} className="text-violet-500" /> Diseño de Portada</h2>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Nombre Interno</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Otoño/Invierno 26" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Título en Portada</label>
                            <input type="text" value={coverTitle} onChange={e => setCoverTitle(e.target.value)} placeholder="Ej: NUEVA COLECCIÓN" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm font-black" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Color Fondo</label>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <input type="color" value={coverColor} onChange={e => setCoverColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                    <span className="text-xs font-mono">{coverColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipografía</label>
                                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold h-[50px]">
                                    <option value="Inter">Inter</option>
                                    <option value="Playfair Display">Playfair</option>
                                    <option value="Space Grotesk">Space Grotesk</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Descripción (Opcional)</label>
                            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve intro..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 mt-1 text-sm resize-none" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 overflow-x-auto gap-3">
                            <h2 className="font-bold text-lg flex items-center gap-2 whitespace-nowrap"><BookOpen size={18} className="text-violet-500" /> Páginas ({items.length})</h2>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => setShowDbModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"><Database size={15} /> Catálogo Web</button>
                                <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"><LinkIcon size={15} /> Drive / Link Externo</button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <BookOpen size={48} className="mb-3" />
                                    <p className="text-sm font-bold">La revista está vacía.</p>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 group">
                                        <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                                        <img src={item.image_url} className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0" onError={(e) => { (e.target as any).src = 'https://placehold.co/100x100?text=Error'; }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                                                {item.sku && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">{item.sku}</span>}
                                                {item.price && <span className="font-bold text-emerald-600">${item.price}</span>}
                                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase">DB</span>
                                            </div>
                                        </div>
                                        <button onClick={() => eliminarItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 transition-colors shrink-0"><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button onClick={handleGuardar} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                        {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} PUBLICAR REVISTA INTERACTIVA
                    </button>
                </div>
            </div>

            {/* MODAL DB */}
            {showDbModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-black text-lg flex items-center gap-2"><Database className="text-indigo-500" /> Catálogo Web</h3>
                            <button onClick={() => setShowDbModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {productosDB.map(p => (
                                <div key={p.id} className="flex items-center gap-3 border border-slate-200 p-3 rounded-2xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-white" onClick={() => agregarProductoDb(p)}>
                                    <img src={p.image_urls?.[0]} className="w-16 h-16 rounded-xl object-cover bg-slate-50" onError={(e) => { (e.target as any).src = 'https://placehold.co/100x100?text=Error'; }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{p.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">${p.price_installments}</p>
                                    </div>
                                    <Plus className="text-indigo-500 shrink-0" size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MANUAL CON GUÍA DE DRIVE */}
            {showManualModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-black text-lg flex items-center gap-2"><LinkIcon className="text-emerald-500" /> Carga por Link o Drive</h3>
                                <p className="text-xs text-slate-500 font-medium">Este producto también se guardará en tu Catálogo General.</p>
                            </div>
                            <button onClick={() => setShowManualModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 pr-3">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 space-y-2">
                                <p className="font-bold text-sm flex items-center gap-2"><Info size={16} /> IMPORTANTE: ¿Cómo usar links de Google Drive?</p>
                                <p className="text-xs leading-relaxed">No uses links de carpetas. Usá el link de la FOTO individual: Click derecho en la foto {'>'} Compartir {'>'} Cambiar a "Cualquier persona con el link" {'>'} Copiar link.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[150px]">
                                    {manualImg && manualImg.includes('http') ? (
                                        <img src={convertirUrlDrive(manualImg)} className="max-w-full max-h-[140px] rounded-lg object-contain" onError={(e) => { (e.target as any).src = 'https://placehold.co/150x150?text=Error'; }} />
                                    ) : (
                                        <ImageIcon size={48} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="md:col-span-8 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Link de la Imagen (Drive o Web) *</label>
                                        <input type="url" value={manualImg} onChange={e => setManualImg(e.target.value)} placeholder="Ej: https://drive.google.com/..." className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xloutline-none focus:border-emerald-500 mt-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                        <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ej: Remera Lisa Algodón" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1.5 text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">SKU</label><input type="text" value={manualSku} onChange={e => setManualSku(e.target.value)} placeholder="ART-123" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">Precio $</label><input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="15999" className="w-full p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-black" /></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                            <button onClick={agregarProductoManualYGuardarEnBD} disabled={loading} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                                {loading ? <Loader2 size={20} className="animate-spin" /> : 'GUARDAR Y AGREGAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}