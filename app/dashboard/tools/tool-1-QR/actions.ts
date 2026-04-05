'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createProductAction(data: any) {
    const { data: newProduct, error } = await supabase
        .from('products')
        .insert([data])
        .select();

    if (error) return { success: false, error: error.message };

    const productId = newProduct[0].id;
    const qrUrl = `https://simplik.com/p/${productId}`;

    await supabase.from('products').update({ qr_code_url: qrUrl }).eq('id', productId);

    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true, productId };
}

// NUEVA ACCIÓN: Eliminar Producto
export async function deleteProductAction(id: string) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true };
}

// NUEVA ACCIÓN: Editar Producto
export async function updateProductAction(id: string, data: any) {
    const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true };
}
// ACCIÓN: Importación masiva (Crear y Actualizar)
export async function bulkUpsertProductsAction(productsList: any[]) {
    // El método 'upsert' de Supabase hace magia: 
    // Si encuentra el ID, actualiza. Si no, inserta.
    const { data, error } = await supabase
        .from('products')
        .upsert(productsList, { onConflict: 'id' })
        .select();

    if (error) {
        console.error('Error masivo:', error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/tools/tool-1-QR');
    return { success: true, count: data.length };
}
// ACCIÓN: Subir imagen al Storage y devolver la URL pública
export async function uploadImageAction(formData: FormData) {
    const file = formData.get('file') as File;
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

    if (error) {
        console.error('Error subiendo imagen:', error.message);
        return { success: false, error: error.message };
    }

    // Obtenemos la URL pública para guardarla en la base de datos
    const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

    return { success: true, url: publicUrlData.publicUrl };
}