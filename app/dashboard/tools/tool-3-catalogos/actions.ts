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