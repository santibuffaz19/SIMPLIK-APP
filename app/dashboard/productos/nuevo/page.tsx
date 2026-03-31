'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UploadCloud, Plus, Trash2, Tag, Image as ImageIcon, Link as LinkIcon, Info, ListTree, Loader2 } from 'lucide-react';

// Importamos la acción que creamos en el archivo actions.ts
import { createProductAction } from '../actions';

export default function NuevoProductoUniversal() {
    const router = useRouter();

    // Estado de carga y error
    const [loading, setLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    // ESTADOS DE LOS INPUTS PRINCIPALES
    const [nombre, setNombre] = useState('');
    const [sku, setSku] = useState('');
    const [categoria, setCategoria] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precioLista, setPrecioLista] = useState('');
    const [precioEfectivo, setPrecioEfectivo] = useState('');
    const [linkExterno, setLinkExterno] = useState('');

    // ESTADOS DINÁMICOS
    const [atributos, setAtributos] = useState([{ id: 1, clave: 'Marca', valor: '' }]);
    const [variantes, setVariantes] = useState([{ id: 1, nombre: 'Opción 1', valores: '' }]);
    const [imagenesSlots, setImagenesSlots] = useState<number[]>([1]);

    // Manejo de Atributos (Ficha Técnica)
    const agregarAtributo = () => setAtributos([...atributos, { id: Date.now(), clave: '', valor: '' }]);
    const eliminarAtributo = (id: number) => setAtributos(atributos.filter(a => a.id !== id));
    const actualizarAtributo = (id: number, campo: 'clave' | 'valor', valor: string) => {
        setAtributos(atributos.map(a => a.id === id ? { ...a, [campo]: valor } : a));
    };

    // Manejo de Variantes (Opciones)
    const agregarVariante = () => setVariantes([...variantes, { id: Date.now(), nombre: '', valores: '' }]);
    const eliminarVariante = (id: number) => setVariantes(variantes.filter(v => v.id !== id));
    const actualizarVariante = (id: number, campo: 'nombre' | 'valores', valor: string) => {
        setVariantes(variantes.map(v => v.id === id ? { ...v, [campo]: valor } : v));
    };

    // Manejo de UI de Imágenes
    const agregarRanuraImagen = () => {
        if (imagenesSlots.length < 5) setImagenesSlots([...imagenesSlots, Date.now()]);
    };

    // --- FUNCIÓN PRINCIPAL DE GUARDADO ---
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
            image_urls: []
        };

        const result = await createProductAction(productData);

        if (result.success) {
            router.push('/dashboard/productos');
        } else {
            setErrorStatus(result.error || 'Ocurrió un error inesperado.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto text-slate-800 pb-12 font-sans">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/productos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
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

                {/* COLUMNA IZQUIERDA */}
                <div className="xl:col-span-2 space-y-6">

                    {/* 1. Información Principal */}
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
                                    <datalist id="categorias-sugeridas">
                                        <option value="Electrónica" />
                                        <option value="Herramientas" />
                                        <option value="Hogar" />
                                    </datalist>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción Pública</label>
                                <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Lo que leerá el cliente final al escanear el QR..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Atributos Fijos */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Info size={20} className="text-indigo-500" /> Ficha Técnica (Datos Fijos)
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Datos que no cambian. Ej: Marca, Peso, Garantía, Vencimiento.</p>

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

                    {/* 3. Variantes */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <ListTree size={20} className="text-indigo-500" /> Opciones / Variantes
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Solo si el cliente final debe elegir. Ej: Talle (S, M, L) o Sabor (Menta, Limón). Separá con comas.</p>

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

                {/* COLUMNA DERECHA */}
                <div className="space-y-6">

                    {/* Multimedia */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className="text-indigo-500" /> Multimedia
                        </h2>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Fotos (Hasta 5)</label>
                            <div className="grid grid-cols-3 gap-2 relative">
                                {imagenesSlots.map((slot, index) => (
                                    <div key={slot} className={`border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-indigo-400 cursor-pointer transition-colors ${index === 0 ? 'col-span-3 aspect-[21/9] py-8' : 'aspect-square'}`}>
                                        <UploadCloud size={index === 0 ? 28 : 20} className="mb-1" />
                                        {index === 0 && <span className="text-xs font-medium">Foto Principal</span>}
                                    </div>
                                ))}
                                {imagenesSlots.length < 5 && (
                                    <div onClick={agregarRanuraImagen} className="border-2 border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 cursor-pointer aspect-square transition-colors">
                                        <Plus size={24} />
                                    </div>
                                )}
                                {/* Overlay temporal */}
                                <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <p className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded-full border">Subida de fotos próximamente</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                <LinkIcon size={16} /> Link a Drive o Video
                            </label>
                            <p className="text-xs text-slate-500 mb-2">Ideal para manuales pesados o videos de YouTube.</p>
                            <input type="url" value={linkExterno} onChange={(e) => setLinkExterno(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                        </div>
                    </div>

                    {/* Precios */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Precios</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Precio de Lista / Tarjetas *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <input type="number" value={precioLista} onChange={(e) => setPrecioLista(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-lg transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Precio Efectivo / Transferencia</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-medium">$</span>
                                    <input type="number" value={precioEfectivo} onChange={(e) => setPrecioEfectivo(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-lg text-emerald-700 transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botón Guardar con estado de carga */}
                    <button
                        onClick={handleGuardar}
                        disabled={loading}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                Guardando en Supabase...
                            </>
                        ) : (
                            <>
                                <Save size={22} /> Guardar Producto
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}