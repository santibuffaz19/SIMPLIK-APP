'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, UploadCloud, Plus, Trash2, Tag,
    Image as ImageIcon, Link as LinkIcon, Info, ListTree, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateProductAction, uploadImageAction } from '../../actions';

export default function EditarProductoUniversal() {
    const router = useRouter();
    const { id } = useParams();

    // Estados de carga y error
    const [loadingPage, setLoadingPage] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<string | null>(null);

    // ESTADOS DE LOS INPUTS
    const [nombre, setNombre] = useState('');
    const [sku, setSku] = useState('');
    const [categoria, setCategoria] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precioLista, setPrecioLista] = useState('');
    const [precioEfectivo, setPrecioEfectivo] = useState('');
    const [linkExterno, setLinkExterno] = useState('');
    const [atributos, setAtributos] = useState<any[]>([]);
    const [variantes, setVariantes] = useState<any[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // 1. CARGAR DATOS INICIALES
    useEffect(() => {
        async function loadProduct() {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                setErrorStatus('No se pudo cargar el producto.');
                setLoadingPage(false);
                return;
            }

            setNombre(data.name);
            setSku(data.sku || '');
            setCategoria(data.category || '');
            setDescripcion(data.description || '');
            setPrecioLista(data.price_installments?.toString() || '');
            setPrecioEfectivo(data.price_cash?.toString() || '');
            setLinkExterno(data.external_link || '');
            setAtributos(data.technical_specs || []);
            setVariantes(data.variants_config || []);
            setImageUrls(data.image_urls || []);

            setLoadingPage(false);
        }
        loadProduct();
    }, [id]);

    // 2. LÓGICA DE SUBIDA DE IMÁGENES
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
            alert("Error al subir: " + res.error);
        }
        setUploading(false);
    };

    const eliminarImagen = (url: string) => {
        setImageUrls(imageUrls.filter(img => img !== url));
    };

    // Manejo de Atributos y Variantes
    const agregarAtributo = () => setAtributos([...atributos, { id: Date.now(), clave: '', valor: '' }]);
    const actualizarAtributo = (idAt: number, campo: string, val: string) => {
        setAtributos(atributos.map(a => a.id === idAt ? { ...a, [campo]: val } : a));
    };

    const agregarVariante = () => setVariantes([...variantes, { id: Date.now(), nombre: '', valores: '' }]);
    const actualizarVariante = (idVar: number, campo: string, val: string) => {
        setVariantes(variantes.map(v => v.id === idVar ? { ...v, [campo]: val } : v));
    };

    // 3. GUARDAR CAMBIOS
    const handleActualizar = async () => {
        setErrorStatus(null);
        setSaving(true);

        const updatedData = {
            name: nombre,
            sku,
            category: categoria,
            description: descripcion,
            price_cash: parseFloat(precioEfectivo) || 0,
            price_installments: parseFloat(precioLista) || 0,
            technical_specs: atributos.filter(a => a.clave && a.valor),
            variants_config: variantes.filter(v => v.nombre && v.valores),
            external_link: linkExterno,
            image_urls: imageUrls
        };

        const result = await updateProductAction(id as string, updatedData);

        if (result.success) {
            router.push('/dashboard/productos');
        } else {
            setErrorStatus(result.error || 'Error al guardar.');
            setSaving(false);
        }
    };

    if (loadingPage) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

    return (
        <div className="max-w-6xl mx-auto pb-12 font-sans text-slate-800">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/productos" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Editar Producto</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    {/* Información Principal */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag size={20} className="text-indigo-500" /> Datos Generales</h2>
                        <div className="space-y-4">
                            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del producto" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU / Código" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                                <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoría" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción para el cliente..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
                        </div>
                    </div>

                    {/* Atributos */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Info size={20} className="text-indigo-500" /> Ficha Técnica</h2>
                        <div className="space-y-3">
                            {atributos.map((at: any) => (
                                <div key={at.id} className="flex gap-2">
                                    <input placeholder="Ej: Marca" value={at.clave} onChange={e => actualizarAtributo(at.id, 'clave', e.target.value)} className="w-1/3 p-2 bg-slate-50 border rounded-lg" />
                                    <input placeholder="Ej: Arcor" value={at.valor} onChange={e => actualizarAtributo(at.id, 'valor', e.target.value)} className="flex-1 p-2 bg-slate-50 border rounded-lg" />
                                    <button onClick={() => setAtributos(atributos.filter(a => a.id !== at.id))} className="text-red-400 p-2"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button onClick={agregarAtributo} className="text-indigo-600 font-bold text-sm flex items-center gap-1"><Plus size={16} /> Agregar Atributo</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Multimedia */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-indigo-500" /> Multimedia</h2>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                    <img src={url} className="w-full h-full object-cover" alt="Producto" />
                                    <button onClick={() => eliminarImagen(url)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 size={12} /></button>
                                </div>
                            ))}
                            {imageUrls.length < 5 && (
                                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50">
                                    {uploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                    <input type="file" className="hidden" onChange={handleUploadImage} accept="image/*" />
                                </label>
                            )}
                        </div>
                        <div className="pt-4 border-t">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1"><LinkIcon size={14} /> LINK VIDEO / DRIVE</label>
                            <input type="url" value={linkExterno} onChange={e => setLinkExterno(e.target.value)} placeholder="https://youtube.com/..." className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                        </div>
                    </div>

                    {/* Precios */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 text-slate-800">Precios</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500">LISTA / TARJETA</label>
                                <input type="number" value={precioLista} onChange={e => setPrecioLista(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-lg font-bold" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">EFECTIVO / TRANSF.</label>
                                <input type="number" value={precioEfectivo} onChange={e => setPrecioEfectivo(e.target.value)} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-lg font-bold text-emerald-700" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleActualizar}
                        disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}