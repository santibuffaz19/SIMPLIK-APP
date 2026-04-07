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

// 4. Eliminar Revista Y LIMPIAR COLECCIONES (CORREGIDO)
export async function eliminarCatalogoAction(id: string) {
    try {
        // 1. Borramos la revista de la base de datos
        const { error } = await supabase.from('tool_catalogs').delete().eq('id', id);
        if (error) throw new Error(error.message);

        // 2. Buscamos en TODAS las colecciones si esta revista estaba adentro
        const { data: colecciones } = await supabase.from('tool_catalog_collections').select('id, description');

        if (colecciones) {
            for (const col of colecciones) {
                try {
                    let mags = JSON.parse(col.description || '[]');
                    // Filtramos sacando la revista que acabamos de borrar
                    const filteredMags = mags.filter((m: any) => m.id !== id);

                    // Si el tamaño cambió, significa que la revista estaba ahí y hay que actualizar la colección
                    if (mags.length !== filteredMags.length) {
                        await supabase.from('tool_catalog_collections')
                            .update({ description: JSON.stringify(filteredMags) })
                            .eq('id', col.id);
                    }
                } catch (e) {
                    console.error("Error limpiando coleccion", e);
                }
            }
        }

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

// 6. Obtener productos de la Base de Datos
export async function obtenerProductosParaCatalogoAction() {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw new Error(error.message);
        return { success: true, data };
    } catch (error: any) { return { success: false, error: error.message }; }
}

// 7. Guardar Colecciones
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

// 8. Eliminar Colecciones
export async function eliminarColeccionAction(id: string) {
    try {
        const { error } = await supabase.from('tool_catalog_collections').delete().eq('id', id);
        if (error) throw new Error(error.message);
        revalidatePath('/dashboard/tools/tool-3-catalogos');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}