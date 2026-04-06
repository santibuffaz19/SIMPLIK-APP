'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, BookOpen, Link as LinkIcon, Loader2, Database, Layout, Image as ImageIcon, X } from 'lucide-react';
import { guardarCatalogoAction, obtenerProductosParaCatalogoAction } from '../actions';

export default function CrearRevista() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [productosDB, setProductosDB] = useState<any[]>([]);

    // Estados de la Revista
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverTitle, setCoverTitle] = useState('');
    const [coverColor, setCoverColor] = useState('#0a0a0a');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [items, setItems] = useState<any[]>([]);

    // Modales y estados de inserción
    const [showDbModal, setShowDbModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    // Estado para carga manual
    const [manualImg, setManualImg] = useState('');
    const [manualName, setManualName] = useState('');
    const [manualSku, setManualSku] = useState('');
    const [manualPrice, setManualPrice] = useState('');
    const [manualVariants, setManualVariants] = useState('');

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
            variants: prod.variants_config ? prod.variants_config.map((v: any) => v.valores).join(' | ') : ''
        }]);
        setShowDbModal(false);
    };

    const agregarProductoManual = () => {
        if (!manualImg || !manualName) return alert("Imagen y Nombre son obligatorios");
        setItems([...items, {
            type: 'manual',
            id: Date.now().toString(),
            name: manualName,
            sku: manualSku,
            price: manualPrice,
            image_url: manualImg,
            variants: manualVariants
        }]);
        setManualImg(''); setManualName(''); setManualSku(''); setManualPrice(''); setManualVariants('');
        setShowManualModal(false);
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

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-24 relative">
            <div className="flex items-center gap-4 mb-8 mt-12 md:mt-0">
                <Link href="/dashboard/tools/tool-3-catalogos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></Link>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Armar Revista 3D</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LADO IZQUIERDO: CONFIGURACIÓN GENERAL */}
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

                {/* LADO DERECHO: PÁGINAS / PRODUCTOS */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-violet-500" /> Páginas ({items.length})</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setShowDbModal(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors"><Database size={14} /> DB</button>
                                <button onClick={() => setShowManualModal(true)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-emerald-100 transition-colors"><LinkIcon size={14} /> Drive / Link</button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <BookOpen size={48} className="mb-3" />
                                    <p className="text-sm font-bold">La revista está vacía.</p>
                                    <p className="text-xs">Agregá productos para crear las páginas.</p>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 group">
                                        <div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><ImageIcon size={16} /></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                {item.sku && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">{item.sku}</span>}
                                                {item.price && <span className="font-bold text-emerald-600">${item.price}</span>}
                                                {item.type === 'manual' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-black">Manual</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => eliminarItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 transition-colors shrink-0"><Trash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button onClick={handleGuardar} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                        {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} PUBLICAR REVISTA
                    </button>
                </div>
            </div>

            {/* MODAL: ELEGIR DE BASE DE DATOS */}
            {showDbModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-black text-lg flex items-center gap-2"><Database className="text-indigo-500" /> Catálogo Web</h3>
                            <button onClick={() => setShowDbModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {loading ? <div className="col-span-full text-center py-10"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div> :
                                productosDB.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 border border-slate-200 p-3 rounded-2xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-white" onClick={() => agregarProductoDb(p)}>
                                        <img src={p.image_urls?.[0] || 'https://placehold.co/100x100?text=Sin+Foto'} className="w-14 h-14 rounded-xl object-cover bg-slate-50" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{p.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">${p.price_installments}</p>
                                        </div>
                                        <Plus className="text-indigo-500 shrink-0" size={20} />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CARGA MANUAL (DRIVE) */}
            {showManualModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-black text-lg flex items-center gap-2"><LinkIcon className="text-emerald-500" /> Carga Externa</h3>
                            <button onClick={() => setShowManualModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Link de la Imagen (Drive / Web) *</label>
                                <input type="url" value={manualImg} onChange={e => setManualImg(e.target.value)} placeholder="https://..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Nombre *</label>
                                <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ej: Remera Lisa" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Código / SKU</label>
                                    <input type="text" value={manualSku} onChange={e => setManualSku(e.target.value)} placeholder="Ej: 546" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Precio</label>
                                    <input type="text" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="Ej: 15000" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Talles / Variantes</label>
                                <input type="text" value={manualVariants} onChange={e => setManualVariants(e.target.value)} placeholder="Ej: S, M, L" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 mt-1 text-sm" />
                            </div>
                            <button onClick={agregarProductoManual} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors mt-2">Agregar a Revista</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}