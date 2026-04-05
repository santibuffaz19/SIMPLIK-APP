'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UploadCloud, Plus, Trash2, Tag, Image as ImageIcon, Link as LinkIcon, Info, ListTree, Loader2, PlusCircle } from 'lucide-react';

import { createProductAction, uploadImageAction } from '../actions';

export default function NuevoProductoUniversal() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    const [nombre, setNombre] = useState('');
    const [sku, setSku] = useState('');
    const [categoria, setCategoria] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precioLista, setPrecioLista] = useState('');
    const [precioEfectivo, setPrecioEfectivo] = useState('');

    // UN SOLO LINK PARA TODO
    const [linkExterno, setLinkExterno] = useState('');

    const [atributos, setAtributos] = useState([{ id: 1, clave: 'Marca', valor: '' }]);
    const [variantes, setVariantes] = useState([{ id: 1, nombre: 'Opción 1', valores: '' }]);
    const [preciosExtra, setPreciosExtra] = useState<{ id: number, nombre: string, valor: string }[]>([]);

    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imagenesSlots, setImagenesSlots] = useState<number[]>([1]);

    // NUEVO ESTADO: Ocultar o mostrar logo global por defecto al crear
    const [showOwnerLogo, setShowOwnerLogo] = useState(true);

    const agregarAtributo = () => setAtributos([...atributos, { id: Date.now(), clave: '', valor: '' }]);
    const eliminarAtributo = (id: number) => setAtributos(atributos.filter(a => a.id !== id));
    const actualizarAtributo = (id: number, campo: 'clave' | 'valor', valor: string) => {
        setAtributos(atributos.map(a => a.id === id ? { ...a, [campo]: valor } : a));
    };

    const agregarVariante = () => setVariantes([...variantes, { id: Date.now(), nombre: '', valores: '' }]);
    const eliminarVariante = (id: number) => setVariantes(variantes.filter(v => v.id !== id));
    const actualizarVariante = (id: number, campo: 'nombre' | 'valores', valor: string) => {
        setVariantes(variantes.map(v => v.id === id ? { ...v, [campo]: valor } : v));
    };

    const agregarPrecioExtra = () => {
        if (preciosExtra.length < 2) setPreciosExtra([...preciosExtra, { id: Date.now(), nombre: '', valor: '' }]);
    };
    const eliminarPrecioExtra = (id: number) => setPreciosExtra(preciosExtra.filter(p => p.id !== id));
    const actualizarPrecioExtra = (id: number, campo: 'nombre' | 'valor', valor: string) => {
        setPreciosExtra(preciosExtra.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const agregarRanuraImagen = () => {
        if (imagenesSlots.length < 5) setImagenesSlots([...imagenesSlots, Date.now()]);
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadImageAction(formData);
        if (res.success && res.url) {
            setImageUrls(prev => [...prev, res.url]);
        } else {
            alert("Error al subir la imagen: " + res.error);
        }
        setUploading(false);
    };

    const eliminarImagen = (url: string) => {
        setImageUrls(imageUrls.filter(img => img !== url));
    };

    const handleGuardar = async () => {
        setErrorStatus(null);
        setLoading(true);

        if (!nombre || !precioLista) {
            setErrorStatus('Por favor, completá al menos el Nombre del producto y el Precio de Lista.');
            setLoading(false);
            return;
        }

        const productData = {
            name: nombre,
            sku: sku,
            category: categoria,
            description: descripcion,
            price_cash: parseFloat(precioEfectivo) || 0,
            price_installments: parseFloat(precioLista) || 0,
            technical_specs: atributos.filter(a => a.clave && a.valor),
            variants_config: variantes.filter(v => v.nombre && v.valores),
            external_link: linkExterno,
            image_urls: imageUrls,
            custom_price_1_name: preciosExtra[0]?.nombre || null,
            custom_price_1_value: parseFloat(preciosExtra[0]?.valor) || null,
            custom_price_2_name: preciosExtra[1]?.nombre || null,
            custom_price_2_value: parseFloat(preciosExtra[1]?.valor) || null,
            // Enviamos a la DB la decisión de mostrar u ocultar el logo
            show_owner_logo_this_product: showOwnerLogo
        };

        const result = await createProductAction(productData);

        if (result.success) {
            router.push('/dashboard/tools/tool-1-QR');
        } else {
            setErrorStatus(result.error || 'Ocurrió un error inesperado.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto text-slate-800 pb-12 font-sans">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/tools/tool-1-QR" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agregar Producto</h1>
                    <p className="text-slate-500 mt-1">Configurá cualquier tipo de artículo o servicio.</p>
                </div>
            </div>

            {errorStatus && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 font-medium text-sm">
                    ⚠️ {errorStatus}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Tag size={20} className="text-indigo-500" /> Información Principal
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del producto *</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Taladro Percutor STANLEY 800W" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Código / SKU</label>
                                    <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Opcional" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                                    <input list="categorias-sugeridas" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Escribí o elegí una..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción Pública</label>
                                <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Lo que leerá el cliente final al escanear el QR..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all" />
                            </div>
                        </div>

                        {/* CHECKBOX SUTIL PARA OCULTAR EL LOGO */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <input
                                    type="checkbox"
                                    checked={showOwnerLogo}
                                    onChange={(e) => setShowOwnerLogo(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                                    Mostrar el logo de mi empresa en este producto
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Info size={20} className="text-indigo-500" /> Ficha Técnica (Datos Fijos)
                        </h2>
                        <div className="space-y-3">
                            {atributos.map((atributo) => (
                                <div key={atributo.id} className="flex items-center gap-3">
                                    <input type="text" placeholder="Ej: Marca" value={atributo.clave} onChange={(e) => actualizarAtributo(atributo.id, 'clave', e.target.value)} className="w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                                    <input type="text" placeholder="Ej: Stanley" value={atributo.valor} onChange={(e) => actualizarAtributo(atributo.id, 'valor', e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                                    <button onClick={() => eliminarAtributo(atributo.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button onClick={agregarAtributo} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2">
                                <Plus size={16} /> Sumar otro dato técnico
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <ListTree size={20} className="text-indigo-500" /> Opciones / Variantes
                        </h2>
                        <div className="space-y-3">
                            {variantes.map((variante) => (
                                <div key={variante.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 relative group">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input type="text" placeholder="Tipo (Ej: Sabor)" value={variante.nombre} onChange={(e) => actualizarVariante(variante.id, 'nombre', e.target.value)} className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                                        <input type="text" placeholder="Opciones (Ej: Menta, Limón)" value={variante.valores} onChange={(e) => actualizarVariante(variante.id, 'valores', e.target.value)} className="md:col-span-2 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                                    </div>
                                    <button onClick={() => eliminarVariante(variante.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button onClick={agregarVariante} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mt-2">
                                <Plus size={18} /> Agregar grupo de opciones
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-indigo-500" /> Multimedia y Links</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Fotos Locales (Hasta 5)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {imageUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={url} className="w-full h-full object-cover" alt="Producto" />
                                        <button onClick={() => eliminarImagen(url)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                                {imageUrls.length < 5 && (
                                    <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                        <input type="file" className="hidden" onChange={handleUploadImage} accept="image/*" />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1"><LinkIcon size={14} /> LINK EXTERNO (YOUTUBE O DRIVE)</label>
                                <input type="url" value={linkExterno} onChange={e => setLinkExterno(e.target.value)} placeholder="https://youtube.com/... o https://drive.google..." className="w-full p-2 bg-slate-50 border rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2"><Tag size={20} className="text-indigo-500" /> Precios</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">LISTA / TARJETA</label>
                                <input type="number" value={precioLista} onChange={e => setPrecioLista(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-lg font-bold outline-none focus:border-indigo-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">EFECTIVO / TRANSF.</label>
                                <input type="number" value={precioEfectivo} onChange={e => setPrecioEfectivo(e.target.value)} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-lg font-bold text-emerald-700 outline-none focus:border-emerald-500 transition-all" />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">Precios Especiales (Opcional)</h3>
                            <div className="space-y-3">
                                {preciosExtra.map((precio) => (
                                    <div key={precio.id} className="flex items-center gap-2">
                                        <input type="text" placeholder="Ej: Cuenta DNI" value={precio.nombre} onChange={(e) => actualizarPrecioExtra(precio.id, 'nombre', e.target.value)} className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                                        <input type="number" placeholder="Valor $" value={precio.valor} onChange={(e) => actualizarPrecioExtra(precio.id, 'valor', e.target.value)} className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                                        <button onClick={() => eliminarPrecioExtra(precio.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {preciosExtra.length < 2 && (
                                    <button type="button" onClick={agregarPrecioExtra} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-2">
                                        <PlusCircle size={16} /> Agregar precio extra
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGuardar}
                        disabled={loading}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        {loading ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                        {loading ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                </div>
            </div>
        </div>
    );
}