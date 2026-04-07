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

    // NUEVO: Array de imágenes de Drive, pero manteniendo todos tus estados.
    const [manualImages, setManualImages] = useState(['']);
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
            image_urls: prod.image_urls || [],
            video_url: prod.video_url || '',
            variants: prod.variants_config ? prod.variants_config.map((v: any) => v.valores).join(' | ') : '',
            technical_specs: prod.technical_specs || []
        }]);
        setShowDbModal(false);
    };

    const agregarProductoManualYGuardarEnBD = async () => {
        const primaryImg = manualImages[0];
        if (!primaryImg || !manualName) return alert("Al menos 1 Imagen y el Nombre son obligatorios");
        setLoading(true);

        const convertedImages = manualImages.filter(img => img.trim() !== '').map(img => convertirUrlDrive(img));
        const finalSpecs = manualSpecs.filter(s => s.clave.trim() && s.valor.trim());
        const finalVariants = manualVariants.trim() ? [{ id: Date.now(), nombre: 'Variante', valores: manualVariants }] : [];

        const { data: newProd, error } = await supabase.from('products').insert({
            name: manualName,
            sku: manualSku || null,
            price_installments: parseFloat(manualPrice) || 0,
            image_urls: convertedImages,
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

        setManualImages(['']); setManualName(''); setManualSku(''); setManualPrice(''); setManualVariants('');
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

    // Funciones para manual
    const agregarSpecManual = () => setManualSpecs([...manualSpecs, { id: Date.now(), clave: '', valor: '' }]);
    const actualizarSpecManual = (id: number, campo: 'clave' | 'valor', valor: string) => {
        setManualSpecs(manualSpecs.map(s => s.id === id ? { ...s, [campo]: valor } : s));
    };
    const eliminarSpecManual = (id: number) => setManualSpecs(manualSpecs.filter(s => s.id !== id));

    const agregarImagenManual = () => setManualImages([...manualImages, '']);
    const actualizarImagenManual = (index: number, valor: string) => {
        const nuevas = [...manualImages];
        nuevas[index] = valor;
        setManualImages(nuevas);
    };
    const eliminarImagenManual = (index: number) => setManualImages(manualImages.filter((_, i) => i !== index));

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
                                <button onClick={() => setShowManualModal(true)} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"><LinkIcon size={15} /> Carga Manual (Drive)</button>
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
                                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase">Agregado</span>
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

            {/* MODAL DB (REPARADO) */}
            {showDbModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h3 className="font-black text-lg flex items-center gap-2"><Database className="text-indigo-500" /> Catálogo Web</h3>
                            <button onClick={() => setShowDbModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 min-h-[200px]">
                            {loading ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                            ) : productosDB.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Database size={48} className="mb-3 opacity-50" />
                                    <p className="font-bold">No hay productos en el Catálogo Web.</p>
                                    <p className="text-sm mt-2">Podés usar la "Carga Manual (Drive)" para sumar artículos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MANUAL CON MULTIPLES LINKS Y TODAS LAS OPCIONES DE VUELTA */}
            {showManualModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-black text-xl flex items-center gap-2"><LinkIcon className="text-emerald-500" /> Carga Manual (Drive)</h3>
                                <p className="text-xs text-slate-500 font-medium">Este producto se guardará permanentemente en tu Catálogo General.</p>
                            </div>
                            <button onClick={() => setShowManualModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 pr-3">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 space-y-2">
                                <p className="font-bold text-sm flex items-center gap-2"><Info size={16} /> REGLA DE ORO DE DRIVE:</p>
                                <p className="text-xs leading-relaxed">No uses links de carpetas. Subí la foto y click derecho en ella {'>'} Compartir {'>'} Cambiar a "Cualquier persona con el link" {'>'} Copiar link.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* SECCIÓN FOTOS */}
                                <div className="md:col-span-5 space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Imágenes ({manualImages.length})</label>
                                    <div className="space-y-3">
                                        {manualImages.map((img, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input type="url" value={img} onChange={e => actualizarImagenManual(idx, e.target.value)} placeholder={`Link ${idx + 1} (Drive)`} className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm`} />
                                                {idx > 0 && <button onClick={() => eliminarImagenManual(idx)} className="p-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}
                                            </div>
                                        ))}
                                        <button onClick={agregarImagenManual} className="text-emerald-600 text-xs font-bold flex items-center gap-1.5 pt-1"><PlusCircle size={15} /> Agregar otra imagen</button>
                                    </div>

                                    {manualImages[0] && manualImages[0].includes('http') && (
                                        <div className="mt-4 flex justify-center">
                                            <img src={convertirUrlDrive(manualImages[0])} className="max-w-full max-h-[150px] rounded-lg object-contain shadow-sm border border-slate-200" onError={(e) => { (e.target as any).src = 'https://placehold.co/150x150?text=Error'; }} />
                                        </div>
                                    )}
                                </div>

                                {/* SECCIÓN DATOS */}
                                <div className="md:col-span-7 grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre del Artículo *</label>
                                        <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ej: Remera Lisa Algodón" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">SKU</label>
                                        <input type="text" value={manualSku} onChange={e => setManualSku(e.target.value)} placeholder="ART-123" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-sm font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Precio $</label>
                                        <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="15999" className="w-full p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl mt-1 text-sm font-black text-emerald-800" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Variantes rápidas</label>
                                        <input type="text" value={manualVariants} onChange={e => setManualVariants(e.target.value)} placeholder="Ej: S | M | L | XL" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN FICHA TÉCNICA */}
                            <div className="border-t border-slate-100 pt-8">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Ficha Técnica ({manualSpecs.length})</label>
                                <div className="space-y-3">
                                    {manualSpecs.map(s => (
                                        <div key={s.id} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center">
                                            <input type="text" value={s.clave} onChange={e => actualizarSpecManual(s.id, 'clave', e.target.value)} placeholder="Campo (Ej: Material)" className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-xs" />
                                            <input type="text" value={s.valor} onChange={e => actualizarSpecManual(s.id, 'valor', e.target.value)} placeholder="Valor (Ej: Algodón)" className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                                            <button onClick={() => eliminarSpecManual(s.id)} className="p-2 text-slate-300 hover:text-red-500"><X size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={agregarSpecManual} className="text-emerald-600 text-xs font-bold flex items-center gap-1.5 pt-1"><PlusCircle size={15} /> Agregar campo técnico</button>
                                </div>
                            </div>
                        </div>

                        {/* Botón Guardar */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                            <button onClick={agregarProductoManualYGuardarEnBD} disabled={loading} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-lg">
                                {loading ? <Loader2 size={24} className="animate-spin" /> : 'GUARDAR PRODUCTO Y AGREGAR A REVISTA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}