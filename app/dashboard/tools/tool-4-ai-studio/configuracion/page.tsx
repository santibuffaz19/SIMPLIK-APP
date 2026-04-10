'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit3, Loader2, User, Save, X, Upload, Tag } from 'lucide-react';
import { getSavedModelsAction, saveSavedModelAction, deleteSavedModelAction } from '../actions';
import { uploadImageAction } from '../../tool-1-QR/actions';

export default function ConfiguracionAiPage() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingModel, setEditingModel] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formImages, setFormImages] = useState<string[]>([]);
    const [formTagInput, setFormTagInput] = useState('');
    const [formTags, setFormTags] = useState<string[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => { loadModels(); }, []);

    const loadModels = async () => {
        setLoading(true);
        const res = await getSavedModelsAction();
        if (res.success && res.data) setModels(res.data);
        setLoading(false);
    };

    const openNew = () => {
        setEditingModel(null);
        setFormName(''); setFormDescription(''); setFormImages([]); setFormTags([]); setFormTagInput(''); setFormError(null);
        setShowForm(true);
    };

    const openEdit = (model: any) => {
        setEditingModel(model);
        setFormName(model.name); setFormDescription(model.description || '');
        setFormImages(model.reference_images || []); setFormTags(model.tags || []);
        setFormTagInput(''); setFormError(null);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este modelo? No podrá recuperarse.')) return;
        setModels(prev => prev.filter(m => m.id !== id));
        await deleteSavedModelAction(id);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || formImages.length >= 5) return;
        setUploadingImage(true);
        const fd = new FormData(); fd.append('file', file);
        const res = await uploadImageAction(fd);
        if (res.success && res.url) setFormImages(prev => [...prev, res.url]);
        setUploadingImage(false);
        e.target.value = '';
    };

    const removeImage = (i: number) => setFormImages(prev => prev.filter((_, idx) => idx !== i));

    const addTag = () => {
        const tag = formTagInput.trim();
        if (tag && !formTags.includes(tag)) {
            setFormTags(prev => [...prev, tag]);
        }
        setFormTagInput('');
    };

    const removeTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag));

    const handleSave = async () => {
        setFormError(null);
        if (!formName.trim()) { setFormError('El nombre es obligatorio.'); return; }
        if (formImages.length === 0) { setFormError('Subí al menos una imagen de referencia.'); return; }

        setSaving(true);
        const res = await saveSavedModelAction({
            id: editingModel?.id,
            name: formName.trim(),
            description: formDescription.trim() || undefined,
            referenceImages: formImages,
            tags: formTags,
        });

        if (res.success) {
            setShowForm(false);
            await loadModels();
        } else {
            setFormError(res.error || 'Error al guardar.');
        }
        setSaving(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-slate-800 pb-16">

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-8 mt-12 md:mt-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/tools/tool-4-ai-studio" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Modelos Guardados</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {models.length}/5 modelos — Reutilizables en sesiones de moda con IA
                        </p>
                    </div>
                </div>
                {models.length < 5 && (
                    <button onClick={openNew}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                        <Plus size={18} /> Nuevo Modelo
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-rose-600" size={36} /></div>
            ) : models.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <User size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Sin modelos guardados</h3>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        Guardá hasta 5 modelos humanos con sus fotos de referencia para usarlos rápidamente en sesiones de moda.
                    </p>
                    <button onClick={openNew} className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black hover:bg-slate-800 transition-colors">
                        <Plus size={18} /> Agregar primer modelo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {models.map(model => (
                        <div key={model.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Preview de imágenes */}
                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                {model.reference_images?.length > 0 ? (
                                    <div className="grid grid-cols-2 h-full gap-0.5">
                                        {model.reference_images.slice(0, 4).map((url: string, i: number) => (
                                            <img key={i} src={url} className="w-full h-full object-cover" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <User size={40} className="text-slate-300" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {model.reference_images?.length || 0} fotos
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-black text-slate-900 text-base mb-1">{model.name}</h3>
                                {model.description && (
                                    <p className="text-xs text-slate-500 font-medium mb-2 line-clamp-2">{model.description}</p>
                                )}
                                {model.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {model.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                    <button onClick={() => openEdit(model)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                                        <Edit3 size={13} /> Editar
                                    </button>
                                    <button onClick={() => handleDelete(model.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Slot vacío */}
                    {models.length < 5 && (
                        <button onClick={openNew}
                            className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all min-h-[280px]">
                            <Plus size={32} />
                            <span className="font-bold text-sm">Agregar modelo ({5 - models.length} disponibles)</span>
                        </button>
                    )}
                </div>
            )}

            {/* Nota */}
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="font-black text-sm text-slate-700 mb-2">Tips para mejores resultados</h4>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                    <li>• Subí entre 2 y 4 fotos del modelo desde ángulos distintos: frente, perfil, cuerpo completo.</li>
                    <li>• Usá fotos con buena iluminación y fondo neutro para que la IA identifique mejor las características.</li>
                    <li>• Los modelos guardados se reutilizan en todas las sesiones de moda sin necesidad de volver a subir las fotos.</li>
                    <li>• La IA usará estas referencias para intentar mantener la apariencia del modelo en la generación.</li>
                </ul>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="font-black text-xl text-slate-900">
                                {editingModel ? 'Editar Modelo' : 'Nuevo Modelo'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-bold">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Nombre del Modelo *</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                                    placeholder="Ej: Laura - Modelo Moda" className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-slate-400 bg-slate-50" />
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Descripción</label>
                                <textarea rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)}
                                    placeholder="Características del modelo, estilo, etc. (opcional)"
                                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 resize-none bg-slate-50" />
                            </div>

                            {/* Imágenes */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3">
                                    Fotos de Referencia * ({formImages.length}/5)
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {formImages.map((url, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={18} className="text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {formImages.length < 5 && (
                                        <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                            {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                            <span className="text-[9px] font-bold mt-1">Subir</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    Recomendado: frente, perfil, cuerpo completo, rostro, espalda
                                </p>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Tags / Etiquetas</label>
                                <div className="flex gap-2 mb-2">
                                    <input type="text" value={formTagInput} onChange={e => setFormTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        placeholder="Ej: femenino, alto, deportivo..." className="flex-1 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 bg-slate-50" />
                                    <button onClick={addTag} className="px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                        <Tag size={14} />
                                    </button>
                                </div>
                                {formTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formTags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500"><X size={11} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 sticky bottom-0 bg-white">
                            <button onClick={handleSave} disabled={saving}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50">
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {saving ? 'Guardando...' : editingModel ? 'Actualizar Modelo' : 'Guardar Modelo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}