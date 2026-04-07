'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 1. Obtener todas las revistas
export async function obtenerCatalogosAction() {
    try {
        const { data, error } = await supabase.from('tool_catalogs').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 2. Obtener todas las colecciones
export async function obtenerColeccionesAction() {
    try {
        const { data, error } = await supabase.from('tool_catalog_collections').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 3. Crear o actualizar Revista
export async function guardarCatalogoAction(catalogo: any) {
    try {
        const { error } = await supabase.from('tool_catalogs').upsert([catalogo], { onConflict: 'id' });
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-3-catalogos');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 4. Eliminar Revista
export async function eliminarCatalogoAction(id: string) {
    try {
        const { error } = await supabase.from('tool_catalogs').delete().eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-3-catalogos');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 5. Obtener configuración de Tool 3
export async function obtenerConfiguracionCatalogosAction() {
    try {
        const { data, error } = await supabase.from('tool_catalogs_settings').select('*').eq('id', 1).single();
        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function guardarConfiguracionCatalogosAction(config: any) {
    try {
        const { error } = await supabase.from('tool_catalogs_settings').upsert({ id: 1, ...config }, { onConflict: 'id' });
        if (error) throw new Error(error.message);
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 6. Obtener productos de la Base de Datos (Tool 1) para inyectarlos en la revista
export async function obtenerProductosParaCatalogoAction() {
    try {
        const { data, error } = await supabase.from('products').select('id, name, sku, price_installments, image_urls, variants_config');
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// NUEVO: Guardar Colecciones
export async function guardarColeccionAction(coleccion: any) {
    try {
        const payload = {
            name: coleccion.name,
            cover_color: coleccion.cover_color || '#4f46e5',
            description: JSON.stringify(coleccion.magazines)
        };
        const { error } = await supabase.from('tool_catalog_collections').insert([payload]);
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-3-catalogos');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// NUEVO: Eliminar Colecciones
export async function eliminarColeccionAction(id: string) {
    try {
        const { error } = await supabase.from('tool_catalog_collections').delete().eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-3-catalogos');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}